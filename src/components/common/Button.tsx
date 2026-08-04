"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-sky-600 text-white shadow-sm shadow-sky-600/20 hover:bg-sky-700 disabled:opacity-50",
  secondary:
    "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50",
  danger:
    "bg-rose-600 text-white shadow-sm shadow-rose-600/20 hover:bg-rose-700 disabled:opacity-50",
  ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50",
};

/**
 * 공통 버튼
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
      className={`inline-flex h-9 items-center justify-center rounded-xl px-4 text-sm font-semibold transition-colors ${variantClass[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
