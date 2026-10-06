"use client";

import type { ReactNode } from "react";

type ToolbarProps = {
  /** 왼쪽: 필터(Input/Select 등) */
  children?: ReactNode;
  /** 오른쪽: 버튼/링크 */
  actions?: ReactNode;
  className?: string;
};

/**
 * 입원 목록 상단 필터/액션 바 — 공통 SearchBar와 같은 카드 모양
 * - SearchBar는 "조회" 버튼으로 제출하는 방식이라, 입력 즉시 걸러지는 입원 목록에는 이걸 씀
 */
export default function Toolbar({ children, actions, className = "" }: ToolbarProps) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{children}</div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
