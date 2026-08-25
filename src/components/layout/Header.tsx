"use client";

import Link from "next/link";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

/**
 * 상단 바
 *
 * 우측 사용자 배지는 로그인한 계정 정보(auth.user)를 그대로 보여준다.
 * 이름이 없으면 사번, 사번도 없으면 로그인 아이디 순으로 대신 표시한다.
 */
export default function Header() {
  const user = useSelector((state: RootState) => state.auth.user);
  const displayName = user?.empName || user?.empNo || user?.loginId || "";
  const badgeText = displayName.slice(0, 2);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur">
      <div className="flex items-center gap-3">
        <Link
          href="/main"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-white transition-colors hover:bg-sky-700"
          aria-label="대문으로 이동"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
        </Link>
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-slate-900">
            Hospital Information System
          </h1>
          <p className="text-[11px] text-slate-400">산대의원 · Admin Console</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/15 sm:inline-flex">
          운영중
        </span>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[10px] font-semibold text-white">
            {badgeText}
          </span>
          <span className="hidden text-xs font-medium text-slate-700 sm:inline">
            {displayName}
          </span>
        </div>
      </div>
    </header>
  );
}
