"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MenuTreeNode } from "@/features/system/types/menuTypes";
import { Alert, ConfirmDialog } from "@/components/common";
import { fetchAuthLogoutRequest } from "@/features/auth/slice/authSlice";
import type { AppDispatch, RootState } from "@/store/store";

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
 * 좌측 업무영역 메뉴 — 병원용 밝은 톤
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

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  // 이 컴포넌트는 위에서 props로 받는 loading/error(메뉴 트리 로딩 상태)와
  // 별개로 로그인 상태(auth)도 다뤄야 해서, 이름이 겹치지 않게 auth 접두사를 붙였다.
  const authLoading = useSelector((state: RootState) => state.auth.loading);
  const authError = useSelector((state: RootState) => state.auth.error);
  const authUser = useSelector((state: RootState) => state.auth.user);

  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  /**
   * true 이면 "로그아웃 확인을 눌러서 결과를 기다리는 중" 이라는 뜻.
   * LoginForm 의 waitRedirect 와 같은 이유로 ref 를 쓴다 — 렌더링을 유발할 필요 없이
   * 아래 useEffect에서 "이번 로그아웃 시도에 대한 반응인지"만 구분하면 되기 때문.
   */
  const waitLogout = useRef(false);

  function handleLogoutClick() {
    setLogoutConfirmOpen(true);
  }

  function handleLogoutCancel() {
    if (authLoading) return;
    setLogoutConfirmOpen(false);
  }

  function handleLogoutConfirm() {
    waitLogout.current = true;
    dispatch(fetchAuthLogoutRequest());
  }

  /**
   * fetchAuthLogoutRequest 도 로그인과 마찬가지로 결과를 바로 안 주고,
   * saga가 로그아웃 API를 호출한 뒤 store(auth.loading/error/user)를 갱신하는 걸 기다려야 한다.
   * 성공하면(user가 비워지면) rootReducer가 전체 상태를 리셋하고 나서 /login 으로 보낸다.
   */
  useEffect(() => {
    if (!waitLogout.current) return;
    if (authLoading) return;
    if (authError) {
      waitLogout.current = false;
      return;
    }
    if (!authUser) {
      waitLogout.current = false;
      router.replace("/login");
    }
  }, [authLoading, authError, authUser, router]);

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
      className={`flex h-full shrink-0 flex-col border-r border-sky-100 bg-[#f3f8fc] text-slate-600 transition-[width] ${
        collapsed ? "w-[88px]" : "w-60"
      }`}
    >
      <div
        className={`flex flex-col gap-2 border-b border-sky-100/80 px-3 pb-4 pt-5 ${
          collapsed ? "items-center" : ""
        }`}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-sm font-bold text-white shadow-sm shadow-sky-500/25">
          HIS
        </div>
        {!collapsed ? (
          <div>
            <p className="text-sm font-semibold text-slate-800">테스트 의원</p>
            <p className="text-[11px] text-slate-400">Hospital Workspace</p>
          </div>
        ) : null}
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-3" aria-label="업무영역 메뉴">
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
                className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-[11px] transition-colors ${
                  areaActive
                    ? "bg-white font-semibold text-sky-700 shadow-sm ring-1 ring-sky-100"
                    : "hover:bg-white/80 hover:text-slate-800"
                }`}
              >
                <span className={areaActive ? "text-sky-600" : "text-slate-400"}>
                  {areaIcon(item.areaKey)}
                </span>
                <span className="text-center leading-tight">{item.menuName}</span>
              </Link>
            );
          }

          return (
            <div key={item.menuId}>
              <button
                type="button"
                onClick={() => toggleArea(key)}
                aria-expanded={expanded}
                className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-sm transition-colors ${
                  areaActive
                    ? "bg-white font-semibold text-sky-700 shadow-sm ring-1 ring-sky-100"
                    : "hover:bg-white/80 hover:text-slate-800"
                }`}
              >
                <span className={areaActive ? "text-sky-600" : "text-slate-400"}>
                  {areaIcon(item.areaKey)}
                </span>
                <span className="flex-1">{item.menuName}</span>
                <svg
                  viewBox="0 0 20 20"
                  className={`h-4 w-4 shrink-0 text-slate-300 transition-transform ${
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
                <ul className="mt-1 space-y-0.5 pb-2 pl-3">
                  {item.menuUrl ? (
                    <li>
                      <Link
                        href={item.menuUrl}
                        className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                          pathname === item.menuUrl
                            ? "bg-sky-50 font-medium text-sky-700"
                            : "text-slate-500 hover:bg-white/90 hover:text-slate-800"
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
                              ? "bg-sky-50 font-medium text-sky-700"
                              : "text-slate-500 hover:bg-white/90 hover:text-slate-800"
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
        className={`mt-auto flex flex-col gap-1 border-t border-sky-100/80 px-2 py-3 text-xs text-slate-400 ${
          collapsed ? "items-center text-[10px]" : ""
        }`}
      >
        <span className={collapsed ? "" : "px-2"}>v0.1.0</span>
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="w-full rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/90 hover:text-slate-600"
        >
          {collapsed ? "펼치기" : "메뉴 접기"}
        </button>
        <button
          type="button"
          className="w-full rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/90 hover:text-slate-600"
        >
          환경설정
        </button>
        <button
          type="button"
          onClick={handleLogoutClick}
          className="w-full rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/90 hover:text-slate-600"
        >
          로그아웃
        </button>
        {authError ? (
          <Alert variant="error" className="mt-1">
            {authError}
          </Alert>
        ) : null}
      </div>

      <ConfirmDialog
        open={logoutConfirmOpen}
        title="로그아웃"
        message="정말 로그아웃하시겠습니까?"
        confirmLabel="로그아웃"
        cancelLabel="취소"
        submitting={authLoading}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </aside>
  );
}
