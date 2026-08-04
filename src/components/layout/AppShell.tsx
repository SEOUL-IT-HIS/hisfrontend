"use client";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/sidebar/Sidebar";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMenuRequest } from "@/features/system/slice/menuSlice";
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

  useEffect(() => {
    dispatch(fetchMenuRequest());
  }, [dispatch]);

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-[var(--background)]">
      <Sidebar menuTree={items} loading={loading} error={error ?? ""} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="min-h-0 flex-1 overflow-auto p-4 md:p-5">{children}</main>
      </div>
    </div>
  );
}
