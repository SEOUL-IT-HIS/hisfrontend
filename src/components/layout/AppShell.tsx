"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/sidebar/Sidebar";
import {
  findChildMenuByPath,
  findWorkAreaMenuByPath,
} from "@/features/system/menuTree";
import {
  fetchMenusRequest,
  selectMenuError,
  selectMenuLoading,
  selectMenuTree,
} from "@/features/system/slice";
import type { AppDispatch } from "@/store/store";
import { usePathname } from "next/navigation";

type AppShellProps = {
  children: React.ReactNode;
  title?: string;
};

/**
 * 화면(Presentation)
 * - API 직접 호출 X
 * - dispatch(Request) 만 하고, 데이터는 selector 로 읽는다
 */
export default function AppShell({ children, title }: AppShellProps) {
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();

  const menuTree = useSelector(selectMenuTree);
  const menuLoading = useSelector(selectMenuLoading);
  const menuError = useSelector(selectMenuError);

  useEffect(() => {
    // 메뉴 로드 요청 → saga 가 API 호출
    dispatch(fetchMenusRequest());
  }, [dispatch]);

  const workAreaMenu = findWorkAreaMenuByPath(menuTree, pathname);
  const childMenu = findChildMenuByPath(menuTree, pathname);
  const resolvedTitle =
    title ?? childMenu?.menuName ?? workAreaMenu?.menuName ?? "HIS";

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-slate-100">
      <Sidebar menuTree={menuTree} loading={menuLoading} error={menuError} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={resolvedTitle} />
        <main className="min-h-0 flex-1 overflow-auto p-3">{children}</main>
      </div>
    </div>
  );
}

export default function AppShell({ children, title }: AppShellProps) {
  return (
    <MenuProvider>
      <AppShellContent title={title}>{children}</AppShellContent>
    </MenuProvider>
  );
}
