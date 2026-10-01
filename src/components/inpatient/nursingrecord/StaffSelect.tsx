"use client";

import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { useStaffOptions } from "@/features/inpatient/admissiondischarge/useDoctorOptions";

type StaffSelectProps = {
  role: "DOCTOR" | "NURSE";
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  className: string;
  required?: boolean;
};

const ROLE_TEXT = { DOCTOR: "doctor", NURSE: "nurse" } as const;

/**
 * admin에 등록된 직원(의사/간호사) 드롭다운 — 저장 값은 직원 ID(empId), 화면에는 이름 (사번)
 * - 목록을 못 불러오면(로그인 세션 문제, 역할 미등록 등) 직접 입력칸으로 대체
 * - 현재 값이 목록에 없어도 선택지로 남겨서 사라지지 않게 함
 *   · 로그인한 사용자 본인이면 이름으로 표시 (예: 간호사 역할이 아닌 계정으로 로그인해 기본값으로 들어간 경우)
 *   · 그 외 예전 값(D22, 숫자 ID 등)은 값 그대로 표시
 */
const StaffSelect = ({ role, id, name, value, onChange, className, required = true }: StaffSelectProps) => {
  const { staff, nameById, loading } = useStaffOptions(role);
  const loginUser = useSelector((state: RootState) => state.auth.user);

  if (!loading && staff.length === 0) {
    return (
      <input type="text" id={id} name={name} value={value} onChange={onChange} required={required}
        placeholder={`${ROLE_TEXT[role]} ID (${ROLE_TEXT[role]} list unavailable)`} className={className} />
    );
  }

  const valueInList = !value || nameById.has(value);
  const extraLabel = value && loginUser?.empId === value && loginUser.empName
    ? `${loginUser.empName} (me)`
    : value;

  return (
    <select id={id} name={name} value={value} onChange={onChange} required={required} className={className}>
      <option value="">{loading ? `Loading ${ROLE_TEXT[role]}s...` : `Select ${ROLE_TEXT[role]}`}</option>
      {!valueInList && <option value={value}>{extraLabel}</option>}
      {staff.map((s) => (
        <option key={s.empId} value={s.empId}>
          {s.empName} ({s.empNo})
        </option>
      ))}
    </select>
  );
};

export default StaffSelect;
