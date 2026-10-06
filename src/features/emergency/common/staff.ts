"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { fetchEmpApi } from "@/features/emp/api/empApi";
import { fetchRoleListApi } from "@/features/emp/api/roleApi";

export type StaffRole = "DOCTOR" | "NURSE";

/** 직원 한 명 (admin 직원 목록에서 필요한 값만) */
export interface StaffOption {
  empId: string;
  empName: string;
  empNo: string;
  /** admin 부서 코드(DEPT_CD). 부서가 등록되지 않은 직원은 null */
  deptCode: string | null;
  role: StaffRole;
}

/**
 * 처리자 칸의 종류
 * - DOCTOR: 의사를 골라서 지정한다(처방의·퇴실/격리 결정·구두 확정·전원소견서)
 * - STAFF : 의사·간호사 중에서 고른다. 기본은 로그인한 사람이다. 병원에서는 PC를 여럿이 같이 쓰고 그때마다 로그아웃하지 않으므로
 *           기록자·시행자·측정자 등도 로그인한 사람으로 고정하지 않고 실제로 한 사람을 고를 수 있게 한다.
 */
export type ActorKind = "DOCTOR" | "STAFF";

interface StaffData {
  /** 재직 중인 의사 */
  doctors: StaffOption[];
  /** 재직 중인 간호사 */
  nurses: StaffOption[];
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

function isNurseRole(roleCode: string, roleName: string): boolean {
  return roleCode.toUpperCase() === "NURSE" || roleName.includes("간호") || roleName.toLowerCase().includes("nurse");
}

function loadStaff(): Promise<StaffData> {
  if (cached && Date.now() - cached.at < cached.ttl) return cached.promise;

  const entry = {
    at: Date.now(),
    ttl: SUCCESS_TTL_MS,
    promise: Promise.all([fetchRoleListApi(), fetchEmpApi()]).then(([roles, emps]): StaffData => {
      const activeRoles = roles.filter((r) => r.useYn !== "N");
      const doctorRoleIds = new Set(activeRoles.filter((r) => isDoctorRole(r.roleCode ?? "", r.roleName ?? "")).map((r) => r.roleId));
      const nurseRoleIds = new Set(activeRoles.filter((r) => isNurseRole(r.roleCode ?? "", r.roleName ?? "")).map((r) => r.roleId));

      const doctors: StaffOption[] = [];
      const nurses: StaffOption[] = [];
      for (const e of emps) {
        if (e.retireDate) continue;
        const roleIds = e.roleIds ?? [];
        const base = { empId: e.empId, empName: e.empName, empNo: e.empNo, deptCode: e.deptCode || null };
        if (roleIds.some((id) => doctorRoleIds.has(id))) doctors.push({ ...base, role: "DOCTOR" });
        else if (roleIds.some((id) => nurseRoleIds.has(id))) nurses.push({ ...base, role: "NURSE" });
      }
      const byName = (a: StaffOption, b: StaffOption) => a.empName.localeCompare(b.empName);
      return { doctors: doctors.sort(byName), nurses: nurses.sort(byName), nameById: new Map(emps.map((e) => [e.empId, e.empName])) };
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
 * admin 직원 목록 — 의사·간호사 드롭다운과 처리자 이름 표시에 쓴다.
 * enabled=false 면 불러오지 않는다. 목록을 못 받으면 doctors·nurses 는 비어 있고 failed=true (화면은 대체 입력으로 넘어간다).
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
    nurses: state.data?.nurses ?? [],
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
 * - "DOCTOR": 드롭다운에서 고른 의사(typed). 아직 안 골랐고 로그인한 사람이 의사면 그 사람이 기본이다.
 * - "STAFF" : 고른 직원(typed). 아직 안 골랐으면 로그인한 사람이 기본이다(의사·간호사 여부와 상관없이).
 */
export function useActorId(typed: string, kind: ActorKind): string {
  const login = useLoginUser();
  const { doctors } = useStaff(kind === "DOCTOR");
  const value = typed.trim();
  if (kind === "DOCTOR") {
    if (value) return value;
    return login.signedIn && doctors.some((d) => d.empId === login.empId) ? login.empId : "";
  }
  return value || (login.signedIn ? login.empId : "");
}
