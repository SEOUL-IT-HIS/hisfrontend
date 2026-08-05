"use client";

import AppShell from "@/components/layout/AppShell";
import { usePathname } from "next/navigation";

type AppFrameProps = {
  children: React.ReactNode;
};

/** 사이드바/헤더 없이 보여주는 경로 (로그인 등) */
const BARE_PATHS = ["/login"];

/**
 * 공통 레이아웃 프레임
 * - /login : AppShell 없이 폼만
 * - 그 외 : Sidebar + Header
 * - 인증 가드는 추후 /api/auth/me 연동 시 복구
 */
export default function AppFrame({ children }: AppFrameProps) {
  const pathname = usePathname();
  const isBare = BARE_PATHS.some(
    (path) => pathname === path || pathname?.startsWith(`${path}/`),
  );

  if (isBare) {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}
