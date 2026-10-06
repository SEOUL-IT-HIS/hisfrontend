"use client";

import type { ReactNode } from "react";
import { Panel } from "@/components/common";

type SectionCardProps = {
  title: ReactNode;
  description?: ReactNode;
  /** 제목 오른쪽 버튼 영역 */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** 본문 여백 — 정보 행(InfoRow)처럼 자체 여백이 있는 내용은 false */
  padded?: boolean;
};

/**
 * 제목이 붙은 공통 Panel — 입원 상세/등록 폼의 바깥 틀
 * - 헤더 모양은 공통 Modal/PageHeader와 맞춤
 */
export default function SectionCard({ title, description, actions, children, className = "", padded = true }: SectionCardProps) {
  return (
    <Panel className={className}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-slate-900">{title}</h2>
          {description ? <p className="mt-0.5 text-xs text-slate-400">{description}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <div className={padded ? "px-5 py-4" : ""}>{children}</div>
    </Panel>
  );
}

/** 상세 화면의 "라벨 : 값" 한 줄 */
export function InfoRow({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 px-5 py-3 text-sm last:border-b-0">
      <span className="shrink-0 text-slate-400">{label}</span>
      <span className="min-w-0 text-right text-slate-800">{children}</span>
    </div>
  );
}
