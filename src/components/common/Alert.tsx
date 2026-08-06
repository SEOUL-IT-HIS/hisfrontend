"use client";

import type { ReactNode } from "react";

type AlertVariant = "error" | "info" | "success";

type AlertProps = {
  variant?: AlertVariant;
  children: ReactNode;
  className?: string;
};

const variantClass: Record<AlertVariant, string> = {
  error: "border-rose-200/80 bg-rose-50 text-rose-700",
  info: "border-sky-200/80 bg-sky-50 text-sky-800",
  success: "border-emerald-200/80 bg-emerald-50 text-emerald-800",
};

/**
 * 공통 알림 메시지
 */
export default function Alert({ variant = "error", children, className = "" }: AlertProps) {
  return (
    <p
      role="alert"
      className={`rounded-xl border px-4 py-2.5 text-sm shadow-sm ${variantClass[variant]} ${className}`}
    >
      {children}
    </p>
  );
}
