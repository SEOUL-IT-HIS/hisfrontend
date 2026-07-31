"use client";

import type { SelectHTMLAttributes } from "react";

export type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  options: SelectOption[];
  /** 첫 옵션으로 빈 값 표시할 때 사용 (예: "선택") */
  placeholder?: string;
};

/**
 * 공통 셀렉트
 * - 코드성 값(상태, 부서 등) 선택에 사용
 */
export default function Select({
  options,
  placeholder,
  className = "",
  disabled,
  ...rest
}: SelectProps) {
  return (
    <select
      disabled={disabled}
      className={`h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-sky-400 disabled:bg-slate-50 disabled:text-slate-500 ${className}`}
      {...rest}
    >
      {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
