"use client";

import { useEffect, useState } from "react";
import { fetchEmpApi } from "@/features/emp/api/empApi";
import { fetchRoleListApi } from "@/features/emp/api/roleApi";

/**
 * admin 직원 목록 — 의사 드롭다운(DoctorSelect, Phase 2)과 처방의사명 표시(Phase 1)에 쓰는 공용 훅.
 * (마무리_최종현황 04번 지시서 Phase 1-C)
 *
 * ⚠ features/emergency/common/staff.ts, features/inpatient/admissiondischarge/useDoctorOptions.ts
 *   와 같은 모양이지만 그쪽을 import 하지 않고 labimaging 전용으로 따로 둔다(지시서 §1-C) —
 *   다른 도메인 화면과 묶이면 이 화면만의 요구(empNo 포함 표시, Unknown 처리 등)가 바뀔 때
 *   서로 건드리게 된다.
 *
 * ⚠ 표시 전용이다. admin 직원 목록을 못 받아도(세션 없음 등) 예외를 던지지 않고 failed=true 만
 *   돌려준다 — 업무(접수·결과 등)는 이 훅과 무관하게 계속 동작해야 한다.
 */

/** 의사 드롭다운에 쓰는 직원 1명 */
export interface StaffOption {
  empId: string;
  empName: string;
  empNo: string;
}

/** empId → 이름 표시용 정보. 퇴사자도 포함한다(예전 기록의 담당자 이름을 보여주기 위해). */
export interface StaffNameInfo {
  empName: string;
  empNo: string;
}

interface StaffDirectoryData {
  doctors: StaffOption[];
  nameById: Record<string, StaffNameInfo>;
}

// 패널마다 직원 목록을 따로 부르지 않고 모듈 전역에서 한 번만 받아 공유한다.
const SUCCESS_TTL_MS = 5 * 60 * 1000;
const FAILURE_TTL_MS = 30 * 1000;

let cached: { at: number; ttl: number; promise: Promise<StaffDirectoryData> } | null = null;

function isDoctorRole(roleCode: string, roleName: string): boolean {
  return (
    roleCode.toUpperCase() === "DOCTOR" ||
    roleName.includes("의사") ||
    roleName.toLowerCase().includes("doctor")
  );
}

function loadStaffDirectory(): Promise<StaffDirectoryData> {
  if (cached && Date.now() - cached.at < cached.ttl) {
    return cached.promise;
  }

  const entry = {
    at: Date.now(),
    ttl: SUCCESS_TTL_MS,
    promise: Promise.all([fetchRoleListApi(), fetchEmpApi()]).then(
      ([roles, emps]): StaffDirectoryData => {
        const doctorRoleIds = new Set(
          roles
            .filter((r) => r.useYn !== "N" && isDoctorRole(r.roleCode ?? "", r.roleName ?? ""))
            .map((r) => r.roleId),
        );
        const doctors = emps
          .filter((e) => !e.retireDate && (e.roleIds ?? []).some((id) => doctorRoleIds.has(id)))
          .map((e) => ({ empId: e.empId, empName: e.empName, empNo: e.empNo }))
          .sort((a, b) => a.empName.localeCompare(b.empName));

        const nameById: Record<string, StaffNameInfo> = {};
        emps.forEach((e) => {
          nameById[e.empId] = { empName: e.empName, empNo: e.empNo };
        });

        return { doctors, nameById };
      },
    ),
  };
  cached = entry;
  // 못 받으면(세션 문제 등) 잠깐만 기억해 두었다가 다시 시도한다 — 화면마다 실패 요청이 몰리지 않게.
  entry.promise.catch(() => {
    entry.ttl = FAILURE_TTL_MS;
  });
  return entry.promise;
}

export function useStaffDirectory() {
  const [state, setState] = useState<{ data: StaffDirectoryData | null; failed: boolean }>({
    data: null,
    failed: false,
  });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loadStaffDirectory()
      .then((data) => {
        if (!cancelled) setState({ data, failed: false });
      })
      .catch(() => {
        if (!cancelled) setState({ data: null, failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  /** 캐시를 무효화하고 다시 받는다(조회 실패 화면의 [Retry] 버튼용). */
  function reload() {
    cached = null;
    setState({ data: null, failed: false });
    setReloadToken((prev) => prev + 1);
  }

  return {
    doctors: state.data?.doctors ?? [],
    nameById: state.data?.nameById ?? {},
    loading: !state.data && !state.failed,
    failed: state.failed,
    reload,
  };
}

/**
 * 직원ID 목록 → 이름 맵. usePatientNames 와 같은 모양(얇은 래퍼) — Phase 1-C 표시 헬퍼용.
 *
 * @example
 *   const { names } = useStaffNames([order.physicianId].filter(Boolean));
 *   names[order.physicianId] ?? "-"
 */
export function useStaffNames(empIds: string[]) {
  const { nameById, loading, failed } = useStaffDirectory();

  const key = [...new Set(empIds.filter(Boolean))].sort().join(",");

  const names: Record<string, string> = {};
  if (key) {
    key.split(",").forEach((empId) => {
      const info = nameById[empId];
      if (info) {
        names[empId] = info.empName;
      }
    });
  }

  return { names, loading, failed };
}

/** 처방의사명 표시 결과. Unknown 일 때만 title 에 원본 ID 를 담아 그 자리(hover)에서만 보이게 한다. */
export interface PhysicianDisplay {
  text: string;
  title?: string;
}

/**
 * 처방의사명 표시 헬퍼. (Phase 1-C)
 *
 * 판정 순서:
 *   1) physicianId 있고 이름 찾음 → 이름
 *   2) physicianId 있고 로딩 중 → "Loading…"
 *   3) physicianId 있는데 못 찾음/조회 실패 → "Unknown" (ID 는 title 에만 — 화면에 UUID 를 그대로 찍지 않는다)
 *   4) physicianId 없고 physicianNo 있음 → physicianNo (수동 접수 건 호환)
 *   5) 둘 다 없음 → "-"
 *
 * ⚠ 사번은 이번에 표시하지 않는다. nameById 의 StaffNameInfo.empNo 를 여기서 함께 붙이면
 *   "이름 (사번)" 으로 쉽게 확장할 수 있지만, 화면 4곳은 이름만 보여주기로 했다(지시서 §1-C).
 */
export function formatPhysician(
  order: { physicianId?: string; physicianNo?: string },
  nameById: Record<string, StaffNameInfo>,
  loading: boolean,
): PhysicianDisplay {
  if (order.physicianId) {
    const info = nameById[order.physicianId];
    if (info) {
      return { text: info.empName };
    }
    if (loading) {
      return { text: "Loading…" };
    }
    return { text: "Unknown", title: order.physicianId };
  }
  if (order.physicianNo) {
    return { text: order.physicianNo };
  }
  return { text: "-" };
}

/**
 * 담당자(접수자·채취자·입력자·확정자·확인자·배정자·서명자·업로더) 표시 헬퍼. (직원ID 화면 노출 정리, 2026-10-05)
 *
 * formatPhysician 과 같은 판정이지만, physicianNo 같은 과거 호환 대체값이 없는 단일 empId 필드용이다.
 * 과거에 등록된 건(직원ID가 아닌 값이 들어있거나, 디렉터리에서 못 찾는 값)은 "Unknown"으로 표시되고
 * 원본 값은 title(마우스 오버)에만 남는다 — 화면에 UUID/옛 자유입력값을 그대로 찍지 않는다.
 * 앞으로 실제 직원ID로 들어오는 건은 디렉터리에 있으면 바로 이름으로 뜬다.
 */
export function formatStaffName(
  empId: string | undefined,
  nameById: Record<string, StaffNameInfo>,
  loading: boolean,
): PhysicianDisplay {
  if (!empId) {
    return { text: "-" };
  }
  const info = nameById[empId];
  if (info) {
    return { text: info.empName };
  }
  if (loading) {
    return { text: "Loading…" };
  }
  return { text: "Unknown", title: empId };
}
