"use client";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/sidebar/Sidebar";
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMenuRequest } from "@/features/system/slice/menuSlice";
import { filterMenuTreeByCodes } from "@/features/system/util/menuTree";
import { RootState } from "@/store/store";

type AppShellProps = {
  children: React.ReactNode;
};

/**
 * 앱 셸 — Sidebar + Header + Main
 */
export default function AppShell({ children }: AppShellProps) {
  const dispatch = useDispatch();
  const items = useSelector((state: RootState) => state.system.items);
  const loading = useSelector((state: RootState) => state.system.loading);
  const error = useSelector((state: RootState) => state.system.error);
  const menuCodes = useSelector((state: RootState) => state.auth.user?.menuCodes);

  useEffect(() => {
    dispatch(fetchMenuRequest());
  }, [dispatch]);

  /*
   * 서버에서 받은 메뉴 전체(items)에서 이 사용자에게 허용된 것만 남긴다.
   *
   * 메뉴 조회 API(/api/admin/menu)는 사용중인 메뉴를 전부 내려준다. 누가 보든 같은 목록이다.
   * 누가 무엇을 볼 수 있는지는 로그인할 때 받은 menuCodes 에 들어 있어서, 화면에 그릴 때
   * 여기서 맞춰 걸러준다.
   *
   * Sidebar 안에서 거르지 않고 여기서 거르는 이유: Sidebar 는 menuTree 를 받아 그리기만 하는
   * 컴포넌트다. 걸러진 트리를 넘겨주면 Sidebar 는 손댈 필요가 없다.
   *
   * useMemo 로 감싼 이유: 이 컴포넌트가 다시 그려질 때마다 트리를 새로 만들면 Sidebar 는
   * 매번 "새 배열"을 받게 되어 불필요하게 다시 그린다. items 나 menuCodes 가 바뀔 때만 계산한다.
   */
  const visibleMenuTree = useMemo(
    () => filterMenuTreeByCodes(items, menuCodes),
    [items, menuCodes],
  );

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-[var(--background)]">
      <Sidebar menuTree={visibleMenuTree} loading={loading} error={error ?? ""} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="min-h-0 flex-1 overflow-auto p-4 md:p-5">{children}</main>
      </div>
    </div>
  );
}
