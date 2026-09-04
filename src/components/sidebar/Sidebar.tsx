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

function hasActiveDescendant(pathname: string, item: MenuTreeNode): boolean {
  if (isActivePath(pathname, item.menuUrl)) return true;
  return item.children.some((child) => hasActiveDescendant(pathname, child));
}

function isWorkAreaActive(pathname: string, item: MenuTreeNode) {
  return hasActiveDescendant(pathname, item);
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
  surgery: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 20 14 10a3 3 0 1 0-4-4L4 16z" />
      <path d="M14 10l6 6" />
      <circle cx="18.5" cy="18.5" r="1.4" />
    </svg>
  ),
};

const defaultAreaIcon = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);

export function areaIcon(areaKey: string | null) {
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
  /**
   * "원무" 같은 최상위 영역 아래, 다시 자식을 가진 노드(예: 접수관리, 수납관리)의
   * 펼침 상태. menuId로 키를 잡고, 값이 아직 없으면(사용자가 직접 토글한 적 없으면)
   * 렌더링 시점에 hasActiveDescendant로 기본값을 계산한다(아래 renderMenuNode 참고).
   */
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

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
   * 성공하면(user가 비워지면) /login 으로 보낸다. (전체 상태 리셋은 하지 않음 — rootReducer.ts는 순수 combineReducers)
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

  function toggleGroup(menuId: string) {
    setOpenGroups((prev) => ({ ...prev, [menuId]: !prev[menuId] }));
  }

  /**
   * 접힌 사이드바에서 업무영역 아이콘을 눌렀을 때.
   * 예전에는 영역의 menuUrl 로 이동했는데, 원무처럼 홈 화면이 없는 영역이 생기면서
   * "사이드바를 펼치고 그 영역을 열어준다" 로 바꿨다.
   */
  function openAreaFromCollapsed(key: string) {
    setCollapsed(false);
    setOpenAreas((prev) => ({ ...prev, [key]: true }));
  }

  /**
   * 원무 영역의 자식(접수관리, 환자관리, 수납관리 ...)부터 재귀적으로 그린다.
   * 자식이 없으면 리프 링크, 있으면 자기 자신도 토글 가능한 그룹으로 그리고
   * (menuUrl이 있으면 "{이름} 홈" 링크를 맨 위에 추가) children을 다시 이 함수로 그린다.
   * <ul className="pl-3">가 레벨마다 중첩되면서 들여쓰기가 자동으로 누적된다.
   */
  function renderMenuNode(node: MenuTreeNode) {
    if (node.children.length === 0) {
      if (!node.menuUrl) return null;
      const active = isActivePath(pathname, node.menuUrl);
      return (
        <li key={node.menuId}>
          <Link
            href={node.menuUrl}
            className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
              active
                ? "bg-sky-50 font-medium text-sky-700"
                : "text-slate-500 hover:bg-white/90 hover:text-slate-800"
            }`}
          >
            {node.menuName}
          </Link>
        </li>
      );
    }

    const expanded = openGroups[node.menuId] ?? hasActiveDescendant(pathname, node);

    return (
      <li key={node.menuId}>
        <button
          type="button"
          onClick={() => toggleGroup(node.menuId)}
          aria-expanded={expanded}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-white/90 hover:text-slate-900"
        >
          <span className="flex-1">{node.menuName}</span>
          <svg
            viewBox="0 0 20 20"
            className={`h-3.5 w-3.5 shrink-0 text-slate-300 transition-transform ${
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
          <ul className="mt-0.5 space-y-0.5 pl-3">
            {node.menuUrl ? (
              <li>
                <Link
                  href={node.menuUrl}
                  className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    pathname === node.menuUrl
                      ? "bg-sky-50 font-medium text-sky-700"
                      : "text-slate-500 hover:bg-white/90 hover:text-slate-800"
                  }`}
                >
                  {node.menuName} Home
                </Link>
              </li>
            ) : null}
            {node.children.map((child) => renderMenuNode(child))}
          </ul>
        ) : null}
      </li>
    );
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
        <Link
          href="/main"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-white shadow-sm shadow-sky-500/25 transition-colors hover:bg-sky-600"
          aria-label="대문으로 이동"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
        </Link>
        {!collapsed ? (
          <div>
            <p className="text-sm font-semibold text-slate-800">SANDAE HOSPITAL</p>
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

          if (collapsed) {
            return (
              <button
                key={item.menuId}
                type="button"
                onClick={() => openAreaFromCollapsed(key)}
                title={item.menuName}
                className={`flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-[11px] transition-colors ${
                  areaActive
                    ? "bg-white font-semibold text-sky-700 shadow-sm ring-1 ring-sky-100"
                    : "hover:bg-white/80 hover:text-slate-800"
                }`}
              >
                <span className={areaActive ? "text-sky-600" : "text-slate-400"}>
                  {areaIcon(item.areaKey)}
                </span>
                <span className="text-center leading-tight">{item.menuName}</span>
              </button>
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
                        {item.menuName} Home
                      </Link>
                    </li>
                  ) : null}
                  {item.children.map((child) => renderMenuNode(child))}
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
          onClick={handleLogoutClick}
          className="w-full rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/90 hover:text-slate-600"
        >
          Logout
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
