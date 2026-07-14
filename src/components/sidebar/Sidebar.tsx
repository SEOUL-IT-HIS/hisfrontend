"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SIDEBAR_MENU, type SidebarMenuItem } from "@/constants/menu";

const serviceIcons: Record<SidebarMenuItem["serviceKey"], ReactNode> = {
  patient: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19c1.5-3.5 4-5 7-5s5.5 1.5 7 5" />
    </svg>
  ),
  reception: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  ),
  billing: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18M7 14h4" />
    </svg>
  ),
  outpatient: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 7h8M8 12h8M8 17h5" />
      <rect x="4" y="3" width="16" height="18" rx="2" />
    </svg>
  ),
  emergency: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M13 3 4 14h7l-1 7 9-11h-7l1-7Z" />
    </svg>
  ),
  inpatient: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 11h18v9H3v-9Z" />
      <path d="M6 11V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" />
      <path d="M10 15h4" />
    </svg>
  ),
  labImaging: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 3h6v4l3 6a4 4 0 0 1-3.5 6h-5A4 4 0 0 1 6 13l3-6V3Z" />
    </svg>
  ),
  pharmacy: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8.5 3.5 20.5 15.5a3.5 3.5 0 0 1-5 5L3.5 8.5a3.5 3.5 0 0 1 5-5Z" />
      <path d="M12 8l4 4" />
    </svg>
  ),
  surgery: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14.5 4.5 19 9l-9.5 9.5L5 14l9.5-9.5Z" />
      <path d="m5 19 3-1" />
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  ),
};

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[96px] shrink-0 flex-col border-r border-slate-200 bg-[#eef2f6] text-slate-600">
      <div className="flex flex-col items-center gap-1 px-2 pb-3 pt-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-500 text-sm font-semibold text-white">
          HIS
        </div>
        <p className="text-center text-[10px] leading-tight text-slate-500">테스트 의원</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-2" aria-label="서비스 메뉴">
        {SIDEBAR_MENU.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.serviceCode}
              href={item.href}
              title={`${item.label} (${item.serviceCode})`}
              className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] transition-colors ${
                active
                  ? "bg-white font-semibold text-sky-600 shadow-sm"
                  : "hover:bg-white/70 hover:text-slate-800"
              }`}
            >
              <span className={active ? "text-sky-600" : "text-slate-500"}>
                {serviceIcons[item.serviceKey]}
              </span>
              <span className="text-center leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-2 border-t border-slate-200 px-2 py-3 text-[10px] text-slate-500">
        <span>v0.1.0</span>
        <button type="button" className="w-full rounded-lg px-1 py-1.5 hover:bg-white/70">
          메뉴 접기
        </button>
        <button type="button" className="w-full rounded-lg px-1 py-1.5 hover:bg-white/70">
          환경설정
        </button>
        <button type="button" className="w-full rounded-lg px-1 py-1.5 text-rose-500 hover:bg-white/70">
          로그아웃
        </button>
      </div>
    </aside>
  );
}
