"use client";

import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

/**
 * 공통 입력 필드
 */
export default function Input({ className = "", disabled, ...rest }: InputProps) {
  return (
    <input
      disabled={disabled}
      className={`h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 disabled:text-slate-500 ${className}`}
      {...rest}
    />
  );
}
