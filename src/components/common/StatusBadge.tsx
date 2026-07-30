"use client";

type StatusBadgeProps = {
  /** Y / N 또는 active / inactive */
  value: string;
  activeLabel?: string;
  inactiveLabel?: string;
  className?: string;
};

/**
 * 공통 상태 배지
 * - 사용여부(Y/N), 활성/비활성 표시
 * - import { StatusBadge } from "@/components/common"
 */
export default function StatusBadge({
  value,
  activeLabel = "사용",
  inactiveLabel = "미사용",
  className = "",
}: StatusBadgeProps) {
  const active = value === "Y" || value === "active";

  return (
    <span
      className={
        active
          ? `inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/15 ${className}`
          : `inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-500/10 ${className}`
      }
    >
      <span
        className={
          active
            ? "h-1.5 w-1.5 rounded-full bg-emerald-500"
            : "h-1.5 w-1.5 rounded-full bg-slate-400"
        }
      />
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}
