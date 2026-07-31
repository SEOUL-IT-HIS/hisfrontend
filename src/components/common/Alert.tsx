"use client";

import type { ReactNode } from "react";

type AlertVariant = "error" | "info" | "success";

type AlertProps = {
  variant?: AlertVariant;
  children: ReactNode;
  className?: string;
};

const variantClass: Record<AlertVariant, string> = {
  error: "border-rose-200 bg-rose-50 text-rose-600",
  info: "border-sky-200 bg-sky-50 text-sky-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

/**
 * 공통 알림 메시지
 * - API 에러, 검증 오류, 안내 문구 표시에 사용
 */
export default function Alert({ variant = "error", children, className = "" }: AlertProps) {
  return (
    <p
      role="alert"
      className={`rounded-lg border px-4 py-2 text-sm ${variantClass[variant]} ${className}`}
    >
      {children}
    </p>
  );
}
