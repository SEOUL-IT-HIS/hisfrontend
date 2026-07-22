"use client";

import AppShell from "@/components/layout/AppShell";

type AppFrameProps = {
  children: React.ReactNode;
};

/**
 * 담당 영역(auth) 초기화 상태
 * - 세션 가드/로그인 분기 제거
 * - 재구현 시 GET /api/auth/me 등으로 인증 분기 복구
 */
export default function AppFrame({ children }: AppFrameProps) {
  return <AppShell>{children}</AppShell>;
}
