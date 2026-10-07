"use client";

import { useMemo } from "react";
import { useDoctorOptions } from "@/features/inpatient/admissiondischarge/useDoctorOptions";
import type { SelectOption } from "@/components/common";

/**
 * 선택한 진료과(DEPT_CD codeValue)에 소속된 의사 select 옵션
 * - 진료과 드롭다운과 같은 방식으로 admin-service 를 직접 조회한다 (reception-service 안 거침).
 * - 의사 = ADM 직원 중 의사 역할인 재직 직원. 저장 값은 EMPLOYEE.EMP_ID
 *   (외래로 가는 접수 이벤트의 data.doctorId 가 이 값이어야 OPD 의 SessionUser.empId 와 맞는다)
 * - 진료과를 고르기 전에는 빈 목록
 */
export function useDeptDoctorOptions(deptId: string) {
  const { doctors, loading, error } = useDoctorOptions();

  const options = useMemo<SelectOption[]>(
    () =>
      deptId
        ? doctors
            .filter((d) => d.deptCode === deptId)
            .map((d) => ({ value: d.empId, label: `${d.empName} (${d.empNo})` }))
        : [],
    [doctors, deptId],
  );

  return { options, loading, error };
}
