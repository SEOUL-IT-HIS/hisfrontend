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

  /**
   * 보호된 경로에서 이미 세션을 확인했는지 (한 번 확인했으면 같은 화면에서 또 물어보지 않기 위함).
   * /login 으로 돌아올 때마다 false로 리셋하는 이유:
   * 로그아웃은 store 전체를 초기 상태로 되돌리는데(rootReducer.ts 참고),
   * 그 초기 상태는 "아직 한 번도 확인 안 한 상태"와 authUser/authError 값이 똑같다(둘 다 null).
   * 그래서 이 ref를 계속 true로 남겨두면, 로그아웃 후 다시 보호된 페이지로 이동했을 때
   * "이미 확인했다"고 착각해서 재확인(fetchAuthMeRequest)을 안 하고 "확인 중..." 화면에
   * 멈춰버리는 버그가 생긴다. /login 재방문 시 리셋해두면 다음 보호 경로 진입 때 다시 확인한다.
   */
  const meChecked = useRef(false);

  // ① 아직 로그인 여부를 모르면(authUser 없음) 서버에 물어본다 (GET /api/auth/me)
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

  // ② ①의 확인 결과가 "로그인 안 되어 있음"으로 나오면 로그인 화면으로 보낸다
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

  // 아직 로그인 여부를 모르는 상태(위 ①이 진행 중)와, 확인 결과 로그인이 안 된 상태(곧 ②가 리다이렉트 시킴)
  // 둘 다 authUser가 없다 — 어느 쪽이든 보호된 화면(AppShell)을 잠깐이라도 보여주면 안 되므로 로딩 화면만 표시한다.
  if (!authUser) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
        확인 중...
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
