"use client";

import type { CodeOption } from "@/features/inpatient/nursingrecord/codes";

type CodeSelectProps = {
  id: string;
  name: string;
  value: string;
  options: CodeOption[];
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  className: string;
  required?: boolean;
};

/**
 * 간호기록 코드 드롭다운 (codes.ts 선택지 사용)
 * - 현재 값이 선택지에 없으면(예전에 직접 입력한 값) 그 값도 선택지로 남겨서 수정 화면에서 사라지지 않게 함
 */
const CodeSelect = ({ id, name, value, options, onChange, className, required = true }: CodeSelectProps) => {
  const valueInOptions = !value || options.some((o) => o.value === value);
  return (
    <select id={id} name={name} value={value} onChange={onChange} required={required} className={className}>
      <option value="">Select</option>
      {!valueInOptions && <option value={value}>{value}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
};

export default CodeSelect;
