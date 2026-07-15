"use client";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/sidebar/Sidebar";
import { MenuProvider, useMenus } from "@/features/admin/MenuProvider";
import { findChildMenuByPath, findWorkAreaMenuByPath } from "@/constants/menu";
import { usePathname } from "next/navigation";

type AppShellProps = {
  children: React.ReactNode;
  title?: string;
};

function AppShellContent({ children, title }: AppShellProps) {
  const pathname = usePathname();
  const { menus } = useMenus();
  const workAreaMenu = findWorkAreaMenuByPath(pathname, menus);
  const childMenu = findChildMenuByPath(pathname, menus);

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

export default function AppShell({ children, title }: AppShellProps) {
  return (
    <MenuProvider>
      <AppShellContent title={title}>{children}</AppShellContent>
    </MenuProvider>
  );
}
