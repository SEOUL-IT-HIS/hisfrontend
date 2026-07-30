"use client";

import type { ReactNode } from "react";

type PanelProps = {
  children: ReactNode;
  className?: string;
  /** 점선 빈 상태 패널 */
  dashed?: boolean;
};

/**
 * 공통 패널 카드
 * - 목록/상세 영역 컨테이너
 * - import { Panel } from "@/components/common"
 */
export default function Panel({
  children,
  className = "",
  dashed = false,
}: PanelProps) {
  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.04)] ${
        dashed
          ? "border-dashed border-slate-300/80 bg-white/70"
          : "border-slate-200/80"
      } ${className}`}
    >
      {children}
    </section>
  );
}
