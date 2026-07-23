"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-50",
  secondary:
    "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50",
  danger: "bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50",
  ghost: "text-slate-500 hover:bg-slate-100 disabled:opacity-50",
};

/**
 * 공통 버튼
 * - CRUD 화면의 저장/취소/삭제/조회 버튼에 사용
 */
export default function Button({
  variant = "primary",
  className = "",
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors ${variantClass[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
