"use client";

import AppShell from "@/components/layout/AppShell";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAuthMeRequest } from "@/features/auth/slice/authSlice";
import type { AppDispatch, RootState } from "@/store/store";

type AppFrameProps = {
  children: React.ReactNode;
};

/** 사이드바/헤더 없이 보여주는 경로 (로그인 등) */
const BARE_PATHS = ["/login"];

/**
 * 공통 레이아웃 프레임
 * - /login : AppShell 없이 폼만
 * - 그 외 : 세션 확인(GET /api/auth/me) 후 인증되면 Sidebar+Header, 아니면 /login 이동
 */
export default function AppFrame({ children }: AppFrameProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const authUser = useSelector((state: RootState) => state.auth.user);
  const authLoading = useSelector((state: RootState) => state.auth.loading);
  const authError = useSelector((state: RootState) => state.auth.error);

  const isBare = BARE_PATHS.some(
    (path) => pathname === path || pathname?.startsWith(`${path}/`),
  );

  /** 보호된 경로에서 이미 세션을 확인했는지 (bare 경로 재방문 시 리셋) */
  const meChecked = useRef(false);

  useEffect(() => {
    if (isBare) {
      meChecked.current = false;
      return;
    }
    if (authUser) return;
    if (authLoading) return;
    if (meChecked.current) return;
    meChecked.current = true;
    dispatch(fetchAuthMeRequest());
  }, [isBare, authUser, authLoading, dispatch]);

  useEffect(() => {
    if (isBare) return;
    if (authUser) return;
    if (authLoading) return;
    if (authError) {
      router.replace("/login");
    }
  }, [isBare, authUser, authLoading, authError, router]);

  if (isBare) {
    return <>{children}</>;
  }

  if (!authUser) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
        확인 중...
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
