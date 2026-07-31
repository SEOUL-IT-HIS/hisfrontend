"use client";

import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
  /** 입력 아래 안내 문구 */
  hint?: string;
  className?: string;
};

/**
 * 공통 폼 필드 (라벨 + 입력 영역)
 * - 등록/수정 모달 폼 레이아웃에 사용
 */
export default function FormField({
  label,
  required = false,
  htmlFor,
  children,
  hint,
  className = "",
}: FormFieldProps) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${className}`} htmlFor={htmlFor}>
      <span className="font-medium text-slate-700">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}
