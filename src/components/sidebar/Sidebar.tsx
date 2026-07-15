"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { clearSession } from "@/features/auth/session";
import {
  findWorkAreaMenuByPath,
  SIDEBAR_MENU,
  type SidebarMenuItem,
  type WorkAreaKey,
} from "@/constants/menu";

const workAreaIcons: Record<WorkAreaKey, ReactNode> = {
  frontOffice: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  ),
  clinical: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 7h8M8 12h8M8 17h5" />
      <rect x="4" y="3" width="16" height="18" rx="2" />
    </svg>
  ),
  ancillary: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 3h6v4l3 6a4 4 0 0 1-3.5 6h-5A4 4 0 0 1 6 13l3-6V3Z" />
    </svg>
  ),
  system: (
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

function isWorkAreaActive(pathname: string, item: SidebarMenuItem) {
  if (isActivePath(pathname, item.href)) return true;
  if (item.children.some((child) => isActivePath(pathname, child.href))) return true;
  return item.serviceRoots.some((root) => isActivePath(pathname, root));
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const activeArea = findWorkAreaMenuByPath(pathname)?.area;

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  const [collapsed, setCollapsed] = useState(false);
  const [openAreas, setOpenAreas] = useState<Record<WorkAreaKey, boolean>>(() => {
    const initial = {} as Record<WorkAreaKey, boolean>;
    for (const item of SIDEBAR_MENU) {
      initial[item.area] = item.area === activeArea;
    }
    return initial;
  });

  useEffect(() => {
    if (!activeArea) return;
    setOpenAreas((prev) => {
      if (prev[activeArea]) return prev;
      return { ...prev, [activeArea]: true };
    });
  }, [activeArea]);

  function toggleArea(area: WorkAreaKey) {
    setOpenAreas((prev) => ({ ...prev, [area]: !prev[area] }));
  }

  return (
    <aside
      className={`flex h-full shrink-0 flex-col border-r border-slate-200 bg-[#eef2f6] text-slate-600 transition-[width] ${
        collapsed ? "w-[96px]" : "w-56"
      }`}
    >
      <div className={`flex flex-col gap-1 px-2 pb-3 pt-4 ${collapsed ? "items-center" : "items-start px-3"}`}>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-500 text-sm font-semibold text-white">
          HIS
        </div>
        {!collapsed ? (
          <p className="text-xs font-medium text-slate-600">테스트 의원</p>
        ) : (
          <p className="text-center text-[10px] leading-tight text-slate-500">테스트 의원</p>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-2" aria-label="업무영역 메뉴">
        {SIDEBAR_MENU.map((item) => {
          const areaActive = isWorkAreaActive(pathname, item);
          const expanded = openAreas[item.area];

          if (collapsed) {
            return (
              <Link
                key={item.area}
                href={item.href}
                title={item.label}
                className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] transition-colors ${
                  areaActive
                    ? "bg-white font-semibold text-sky-600 shadow-sm"
                    : "hover:bg-white/70 hover:text-slate-800"
                }`}
              >
                <span className={areaActive ? "text-sky-600" : "text-slate-500"}>
                  {workAreaIcons[item.area]}
                </span>
                <span className="text-center leading-tight">{item.label}</span>
              </Link>
            );
          }

          return (
            <div key={item.area} className="rounded-xl">
              <button
                type="button"
                onClick={() => toggleArea(item.area)}
                aria-expanded={expanded}
                className={`flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm transition-colors ${
                  areaActive
                    ? "bg-white font-semibold text-sky-600 shadow-sm"
                    : "hover:bg-white/70 hover:text-slate-800"
                }`}
              >
                <span className={areaActive ? "text-sky-600" : "text-slate-500"}>
                  {workAreaIcons[item.area]}
                </span>
                <span className="flex-1">{item.label}</span>
                <svg
                  viewBox="0 0 20 20"
                  className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                    expanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden
                >
                  <path d="M5 7.5 10 12.5 15 7.5" />
                </svg>
              </button>

              {expanded ? (
                <ul className="mt-1 space-y-0.5 pb-1 pl-2">
                  <li>
                    <Link
                      href={item.href}
                      className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                        pathname === item.href
                          ? "bg-sky-50 font-medium text-sky-600"
                          : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
                      }`}
                    >
                      {item.label} 홈
                    </Link>
                  </li>
                  {item.children.map((child) => {
                    const childActive = isActivePath(pathname, child.href);
                    return (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                            childActive
                              ? "bg-sky-50 font-medium text-sky-600"
                              : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
                          }`}
                        >
                          {child.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div
        className={`mt-auto flex flex-col gap-1 border-t border-slate-200 px-2 py-3 text-xs text-slate-500 ${
          collapsed ? "items-center text-[10px]" : ""
        }`}
      >
        <span className={collapsed ? "" : "px-2"}>v0.1.0</span>
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="w-full rounded-lg px-2 py-1.5 text-left hover:bg-white/70"
        >
          {collapsed ? "메뉴 펼치기" : "메뉴 접기"}
        </button>
        <button type="button" className="w-full rounded-lg px-2 py-1.5 text-left hover:bg-white/70">
          환경설정
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-lg px-2 py-1.5 text-left text-rose-500 hover:bg-white/70"
        >
          로그아웃
        </button>
      </div>
    </aside>
  );
}
