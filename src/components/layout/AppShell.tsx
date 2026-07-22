"use client";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/sidebar/Sidebar";

type AppShellProps = {
  children: React.ReactNode;
};

/**
 * 담당 영역(system 메뉴) 초기화 상태
 * - 메뉴 API/Redux 연동 제거
 * - 재구현 시 fetchMenusRequest 등으로 복구
 */
export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-slate-100">
      <Sidebar menuTree={[]} loading={false} error="" />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="min-h-0 flex-1 overflow-auto p-3">{children}</main>
      </div>
    </div>
  );
}
