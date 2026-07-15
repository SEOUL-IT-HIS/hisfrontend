"use client";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/sidebar/Sidebar";
import { findChildMenuByPath, findWorkAreaMenuByPath } from "@/constants/menu";
import { usePathname } from "next/navigation";

type AppShellProps = {
  children: React.ReactNode;
  title?: string;
};

export default function AppShell({ children, title }: AppShellProps) {
  const pathname = usePathname();
  const workAreaMenu = findWorkAreaMenuByPath(pathname);
  const childMenu = findChildMenuByPath(pathname);

  const resolvedTitle = title ?? childMenu?.label ?? workAreaMenu?.label ?? "HIS";

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-slate-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={resolvedTitle} />
        <main className="min-h-0 flex-1 overflow-auto p-3">{children}</main>
      </div>
    </div>
  );
}
