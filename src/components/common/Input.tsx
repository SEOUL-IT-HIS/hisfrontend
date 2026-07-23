"use client";

import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

/**
 * 공통 입력 필드
 * - 등록/수정 폼, 검색 조건 입력에 사용
 */
export default function Input({ className = "", disabled, ...rest }: InputProps) {
  return (
    <input
      disabled={disabled}
      className={`h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none focus:border-sky-400 disabled:bg-slate-50 disabled:text-slate-500 ${className}`}
      {...rest}
    />
  );
}
