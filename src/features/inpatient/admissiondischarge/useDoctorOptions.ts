"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchEmpApi } from "@/features/emp/api/empApi";
import { fetchRoleListApi } from "@/features/emp/api/roleApi";

export type StaffOption = {
  empId: string;   // 저장하는 값 (담당의 / 간호기록 기록자) — 외래 처방의사 prescribedBy로도 그대로 전달
  empName: string;
  empNo: string;
  deptCode: string | null;
};
/** @deprecated 이름 호환용 — StaffOption과 같음 */
export type DoctorOption = StaffOption;

type StaffRole = "DOCTOR" | "NURSE";

// admin 역할 판별 — roleCode 우선, 역할 이름으로도 한 번 더 확인
const ROLE_MATCHERS: Record<StaffRole, (roleCode: string, roleName: string) => boolean> = {
  DOCTOR: (code, name) => code === "DOCTOR" || name.includes("의사") || name.toLowerCase().includes("doctor"),
  NURSE: (code, name) => code === "NURSE" || name.includes("간호") || name.toLowerCase().includes("nurse"),
};

/**
 * admin에 등록된 직원 중 특정 역할(의사/간호사)인 재직 중 직원 목록
 * - /api/admin/role/list 에서 해당 역할 ID를 찾고, /api/admin/emp/list 에서 그 역할을 가진 직원만 거름
 * - 두 API 모두 로그인 세션이 필요 — 실패하면 빈 목록 + error (화면은 직접 입력으로 대체)
 * - nameById: 저장된 직원 ID(empId) → 이름 표시용. 목록에 없는 예전 값(D22, 숫자 ID 등)은 그대로 보여주면 됨
 */
export function useStaffOptions(role: StaffRole) {
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchRoleListApi(), fetchEmpApi()])
      .then(([roles, emps]) => {
        if (cancelled) return;
        const matches = ROLE_MATCHERS[role];
        const roleIds = new Set(
          roles
            .filter((r) => r.useYn !== "N" && matches((r.roleCode ?? "").toUpperCase(), r.roleName ?? ""))
            .map((r) => r.roleId),
        );
        const list = emps
          .filter((e) => !e.retireDate && (e.roleIds ?? []).some((id) => roleIds.has(id)))
          .map((e) => ({ empId: e.empId, empName: e.empName, empNo: e.empNo, deptCode: e.deptCode }))
          .sort((a, b) => a.empName.localeCompare(b.empName));
        setStaff(list);
      })
      .catch(() => {
        if (!cancelled) setError(`Failed to load ${role.toLowerCase()} list`);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [role]);

  const nameById = useMemo(() => new Map(staff.map((s) => [s.empId, s.empName])), [staff]);
  return { staff, nameById, loading, error };
}

/** admin에 등록된 의사 목록 (담당의 지정, 처방의사 표시) */
export function useDoctorOptions() {
  const { staff, ...rest } = useStaffOptions("DOCTOR");
  return { doctors: staff, ...rest };
}

/** admin에 등록된 간호사 목록 (간호기록 기록자/평가자 선택) */
export function useNurseOptions() {
  const { staff, ...rest } = useStaffOptions("NURSE");
  return { nurses: staff, ...rest };
}
