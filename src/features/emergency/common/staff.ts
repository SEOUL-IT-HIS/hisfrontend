"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { fetchEmpApi } from "@/features/emp/api/empApi";
import { fetchRoleListApi } from "@/features/emp/api/roleApi";

/** 직원 한 명 (admin 직원 목록에서 필요한 값만) */
export interface StaffOption {
  empId: string;
  empName: string;
  empNo: string;
}

interface StaffData {
  /** 재직 중인 의사 */
  doctors: StaffOption[];
  /** 직원 ID → 이름 (퇴사자 포함 — 예전 기록의 처리자 이름을 보여주려고) */
  nameById: Map<string, string>;
}

// 처리자 칸이 여러 패널에 흩어져 있어 직원 목록을 패널마다 부르지 않고 한 번 받아 둔다.
const SUCCESS_TTL_MS = 5 * 60 * 1000;
const FAILURE_TTL_MS = 30 * 1000;

let cached: { at: number; ttl: number; promise: Promise<StaffData> } | null = null;

function isDoctorRole(roleCode: string, roleName: string): boolean {
  return roleCode.toUpperCase() === "DOCTOR" || roleName.includes("의사") || roleName.toLowerCase().includes("doctor");
}

function loadStaff(): Promise<StaffData> {
  if (cached && Date.now() - cached.at < cached.ttl) return cached.promise;

  const entry = {
    at: Date.now(),
    ttl: SUCCESS_TTL_MS,
    promise: Promise.all([fetchRoleListApi(), fetchEmpApi()]).then(([roles, emps]): StaffData => {
      const doctorRoleIds = new Set(
        roles.filter((r) => r.useYn !== "N" && isDoctorRole(r.roleCode ?? "", r.roleName ?? "")).map((r) => r.roleId),
      );
      const doctors = emps
        .filter((e) => !e.retireDate && (e.roleIds ?? []).some((id) => doctorRoleIds.has(id)))
        .map((e) => ({ empId: e.empId, empName: e.empName, empNo: e.empNo }))
        .sort((a, b) => a.empName.localeCompare(b.empName));
      return { doctors, nameById: new Map(emps.map((e) => [e.empId, e.empName])) };
    }),
  };
  cached = entry;
  // 목록을 못 받으면(세션 문제 등) 잠깐만 기억해 두었다가 다시 시도한다 — 패널마다 실패 요청이 몰리지 않게
  entry.promise.catch(() => {
    entry.ttl = FAILURE_TTL_MS;
  });
  return entry.promise;
}

/**
 * admin 직원 목록 — 의사 드롭다운과 처리자 이름 표시에 쓴다.
 * enabled=false 면 불러오지 않는다. 목록을 못 받으면 doctors 는 비어 있고 failed=true (화면은 직접 입력으로 대체).
 */
export function useStaff(enabled = true) {
  const [state, setState] = useState<{ data: StaffData | null; failed: boolean }>({ data: null, failed: false });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    loadStaff()
      .then((data) => {
        if (!cancelled) setState({ data, failed: false });
      })
      .catch(() => {
        if (!cancelled) setState({ data: null, failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return {
    doctors: state.data?.doctors ?? [],
    nameById: state.data?.nameById ?? new Map<string, string>(),
    loading: enabled && !state.data && !state.failed,
    failed: state.failed,
  };
}

/** 로그인한 사용자 (세션에서 받아 둔 state.auth.user) */
export function useLoginUser() {
  const user = useSelector((state: RootState) => state.auth.user);
  const empId = user?.empId ?? "";
  return { empId, empName: user?.empName || empId, signedIn: empId !== "" };
}

/**
 * 기록·처리에 실제로 보낼 처리자 ID.
 * - 기본(role 없음): 로그인한 사용자. 로그인 정보가 없는 환경(단독 실행 등)에서만 직접 입력한 값(typed)을 쓴다.
 * - role="DOCTOR": 드롭다운에서 고른 의사(typed). 아직 안 골랐고 로그인한 사람이 의사면 그 사람이 기본이다.
 */
export function useActorId(typed: string, role?: "DOCTOR"): string {
  const login = useLoginUser();
  const { doctors } = useStaff(role === "DOCTOR");
  const value = typed.trim();
  if (role === "DOCTOR") {
    if (value) return value;
    return login.signedIn && doctors.some((d) => d.empId === login.empId) ? login.empId : "";
  }
  return login.signedIn ? login.empId : value;
}
