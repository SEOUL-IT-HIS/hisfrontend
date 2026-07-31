"use client";

import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  /** 우측 액션 영역 (등록 버튼 등) */
  actions?: ReactNode;
  className?: string;
};

/**
 * 공통 페이지 헤더
 * - CRUD 목록 화면 상단 제목 + 액션 버튼 영역에 사용
 */
export default function PageHeader({ title, actions, className = "" }: PageHeaderProps) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 ${className}`}
    >
      <h2 className="text-base font-semibold text-slate-800">{title}</h2>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
