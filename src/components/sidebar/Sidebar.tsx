"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { MenuTreeNode } from "@/features/system/types/menuTypes";

type SidebarProps = {
  menuTree: MenuTreeNode[];
  loading?: boolean;
  error?: string;
};

function matchesPath(pathname: string, href: string | null | undefined) {
  if (!href) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isActivePath(pathname: string, href: string | null | undefined) {
  return matchesPath(pathname, href);
}

function isWorkAreaActive(pathname: string, item: MenuTreeNode) {
  if (isActivePath(pathname, item.menuUrl)) return true;
  return item.children.some((child) => isActivePath(pathname, child.menuUrl));
}

const workAreaIcons: Record<string, ReactNode> = {
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

const defaultAreaIcon = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);

function areaIcon(areaKey: string | null) {
  if (!areaKey) return defaultAreaIcon;
  return workAreaIcons[areaKey] ?? defaultAreaIcon;
}

function areaStateKey(item: MenuTreeNode) {
  return item.areaKey ?? `menu-${item.menuId}`;
}

/**
 * 담당 영역(auth logout / system menu API) 초기화 상태
 * - 메뉴 트리는 props 로만 받음 (현재 AppShell 에서 빈 배열)
 * - 로그아웃 API 연동 제거
 */
export default function Sidebar({ menuTree, loading = false, error = "" }: SidebarProps) {
  const pathname = usePathname();

  const activeAreaKey = (() => {
    for (const item of menuTree) {
      if (isWorkAreaActive(pathname, item)) {
        return areaStateKey(item);
      }
    }
    return undefined;
  })();

  const [collapsed, setCollapsed] = useState(false);
  const [openAreas, setOpenAreas] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpenAreas((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const item of menuTree) {
        const key = areaStateKey(item);
        if (!(key in next)) {
          next[key] = key === activeAreaKey;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [menuTree, activeAreaKey]);

  useEffect(() => {
    if (!activeAreaKey) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpenAreas((prev) => {
      if (prev[activeAreaKey]) return prev;
      return { ...prev, [activeAreaKey]: true };
    });
  }, [activeAreaKey]);

  function toggleArea(key: string) {
    setOpenAreas((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <aside
      className={`flex h-full shrink-0 flex-col border-r border-slate-200 bg-[#eef2f6] text-slate-600 transition-[width] ${
        collapsed ? "w-24" : "w-56"
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
        {loading ? (
          <p className="px-2 py-3 text-xs text-slate-400">메뉴 불러오는 중…</p>
        ) : null}
        {error ? (
          <p className="px-2 py-3 text-xs text-rose-500">{error}</p>
        ) : null}
        {!loading && !error && menuTree.length === 0 ? (
          <p className="px-2 py-3 text-xs text-slate-400">표시할 메뉴가 없습니다.</p>
        ) : null}

        {menuTree.map((item) => {
          const key = areaStateKey(item);
          const areaActive = isWorkAreaActive(pathname, item);
          const expanded = openAreas[key];
          const homeHref = item.menuUrl ?? "#";

          if (collapsed) {
            return (
              <Link
                key={item.menuId}
                href={homeHref}
                title={item.menuName}
                className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] transition-colors ${
                  areaActive
                    ? "bg-white font-semibold text-sky-600 shadow-sm"
                    : "hover:bg-white/70 hover:text-slate-800"
                }`}
              >
                <span className={areaActive ? "text-sky-600" : "text-slate-500"}>
                  {areaIcon(item.areaKey)}
                </span>
                <span className="text-center leading-tight">{item.menuName}</span>
              </Link>
            );
          }

          return (
            <div key={item.menuId} className="rounded-xl">
              <button
                type="button"
                onClick={() => toggleArea(key)}
                aria-expanded={expanded}
                className={`flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm transition-colors ${
                  areaActive
                    ? "bg-white font-semibold text-sky-600 shadow-sm"
                    : "hover:bg-white/70 hover:text-slate-800"
                }`}
              >
                <span className={areaActive ? "text-sky-600" : "text-slate-500"}>
                  {areaIcon(item.areaKey)}
                </span>
                <span className="flex-1">{item.menuName}</span>
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
                  {item.menuUrl ? (
                    <li>
                      <Link
                        href={item.menuUrl}
                        className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                          pathname === item.menuUrl
                            ? "bg-sky-50 font-medium text-sky-600"
                            : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
                        }`}
                      >
                        {item.menuName} 홈
                      </Link>
                    </li>
                  ) : null}
                  {item.children.map((child) => {
                    if (!child.menuUrl) return null;
                    const childActive = isActivePath(pathname, child.menuUrl);
                    return (
                      <li key={child.menuId}>
                        <Link
                          href={child.menuUrl}
                          className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                            childActive
                              ? "bg-sky-50 font-medium text-sky-600"
                              : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
                          }`}
                        >
                          {child.menuName}
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
      </div>
    </aside>
  );
}
