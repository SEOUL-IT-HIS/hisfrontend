"use client";

import { useNurseOptions } from "@/features/inpatient/admissiondischarge/useDoctorOptions";

type NurseSelectProps = {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  className: string;
  required?: boolean;
};

/**
 * 간호기록 기록자/평가자 선택 — admin에 등록된 간호사(역할이 간호사인 재직 직원) 드롭다운
 * - 저장 값은 직원 ID(empId), 화면에는 이름 (사번)
 * - 간호사 목록을 못 불러오면(로그인 세션 문제, 간호사 역할 미등록 등) 직접 입력칸으로 대체
 * - 현재 값이 목록에 없으면(예: 로그인한 사용자가 간호사 역할이 아님, 예전 숫자 ID) 그 값도 선택지로 남겨서 사라지지 않게 함
 * - onChange는 기존 폼의 onChange(name/value 기반)를 그대로 받도록 input/select 이벤트 형태 유지
 */
const NurseSelect = ({ id, name, value, onChange, className, required = true }: NurseSelectProps) => {
  const { nurses, nameById, loading } = useNurseOptions();

  if (!loading && nurses.length === 0) {
    return (
      <input type="text" id={id} name={name} value={value} onChange={onChange} required={required}
        placeholder="Nurse ID (nurse list unavailable)" className={className} />
    );
  }

  const valueInList = !value || nameById.has(value);
  return (
    <select id={id} name={name} value={value} onChange={onChange} required={required} className={className}>
      <option value="">{loading ? "Loading nurses..." : "Select nurse"}</option>
      {!valueInList && <option value={value}>{value}</option>}
      {nurses.map((n) => (
        <option key={n.empId} value={n.empId}>
          {n.empName} ({n.empNo})
        </option>
      ))}
    </select>
  );
};

export default NurseSelect;
