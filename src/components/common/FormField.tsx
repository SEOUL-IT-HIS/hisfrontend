"use client";

import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
  hint?: string;
  className?: string;
};

/**
 * 공통 폼 필드 (라벨 + 입력)
 * - 등록/수정 Modal 폼에서 사용
 * - import { FormField } from "@/components/common"
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
    <label className={`flex flex-col gap-1.5 text-sm ${className}`} htmlFor={htmlFor}>
      <span className="font-semibold text-slate-700">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="text-xs leading-4 text-slate-400">{hint}</span> : null}
    </label>
  );
}
