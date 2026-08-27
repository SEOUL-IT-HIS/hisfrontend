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
// TODO: 로그인 없이 화면 확인용 임시 우회 — 작업 끝나면 "/billing/detail" 제거할 것
const BARE_PATHS = ["/login", "/billing/detail"];
const ACTIVITY_CHECK_INTERVAL = 1000 * 60 * 5;

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
   * 로그인 우회 (개인 PC 로컬 개발 전용)
   * - admin-service 없이 내 서비스 화면만 확인하고 싶을 때 .env.local에
   *   NEXT_PUBLIC_SKIP_AUTH=true 로 설정하면 세션 확인 없이 바로 AppShell을 보여준다.
   * - 절대 커밋/공유하지 말 것 (.env.local 자체가 git 제외라 안전함)
   */
  const skipAuth = process.env.NEXT_PUBLIC_SKIP_AUTH === "true";

  /**
   * 보호된 경로에서 이미 세션을 확인했는지 (한 번 확인했으면 같은 화면에서 또 물어보지 않기 위함).
   * /login 으로 돌아올 때마다 false로 리셋하는 이유:
   * 로그아웃하면 authSlice의 fetchAuthLogoutSuccess가 user/error를 다시 null로 되돌리는데,
   * 그 값이 "아직 한 번도 확인 안 한 상태"와 authUser/authError 값이 똑같다(둘 다 null).
   * 그래서 이 ref를 계속 true로 남겨두면, 로그아웃 후 다시 보호된 페이지로 이동했을 때
   * "이미 확인했다"고 착각해서 재확인(fetchAuthMeRequest)을 안 하고 "확인 중..." 화면에
   * 멈춰버리는 버그가 생긴다. /login 재방문 시 리셋해두면 다음 보호 경로 진입 때 다시 확인한다.
   */
  const meChecked = useRef(false);


  /**
   * 한 번이라도 로그인 상태(authUser 있음)였던 적이 있는지.
   * true인 상태에서 authError가 뜨면 "로그인 중 만료"로 보고 /login?reason=expired 로 보낸다.
   * false인 상태(최초 진입, 한 번도 로그인한 적 없음)에서 authError가 뜨면 그냥 /login 으로 보낸다.
   */
  const hadSession = useRef(false);


  /** 활동 감지로 마지막에 /api/auth/me 를 재확인한 시각(ms) */
  const lastActivityCheckAt = useRef(0);

  // ① 아직 로그인 여부를 모르면(authUser 없음) 서버에 물어본다 (GET /api/auth/me)
  useEffect(() => {
    if (isBare) {
      meChecked.current = false;
      hadSession.current = false;
      return;
    }
    if (skipAuth) return;
    if (authUser) return;
    if (authLoading) return;
    if (meChecked.current) return;
    meChecked.current = true;
    dispatch(fetchAuthMeRequest());
  }, [isBare, authUser, authLoading, dispatch]);

  // authUser가 채워질 때마다(최초 로그인 성공이든, 활동으로 인한 재확인 성공이든)
  // "로그인된 적 있음" 표시 + 다음 활동 확인 기준 시각을 갱신한다
  useEffect(() => {
    if (authUser) {
      hadSession.current = true;
      lastActivityCheckAt.current = Date.now();
    }
  }, [authUser]);

  // 로그인 상태일 때만 클릭/키입력을 감지해서, ACTIVITY_CHECK_INTERVAL 넘게 재확인 안 했으면
  // /api/auth/me 를 다시 호출한다 (고정 간격 폴링이 아니라 "활동이 있을 때만" 확인).
  useEffect(() => {
    if (isBare) return;
    if (skipAuth) return;
    if (!authUser) return;

    function handleActivity() {
      const now = Date.now();
      if (now - lastActivityCheckAt.current < ACTIVITY_CHECK_INTERVAL) return;
      lastActivityCheckAt.current = now;
      dispatch(fetchAuthMeRequest());
    }

    document.addEventListener("click", handleActivity);
    document.addEventListener("keydown", handleActivity);
    return () => {
      document.removeEventListener("click", handleActivity);
      document.removeEventListener("keydown", handleActivity);
    };
  }, [isBare, authUser, dispatch]);

  // ② ①의 확인 결과가 "로그인 안 되어 있음"으로 나오면 로그인 화면으로 보낸다
  // hadSession이 true였다면 "쓰다가 만료된 것"이므로 안내 문구가 붙는 경로로 보낸다
  useEffect(() => {
    if (isBare) return;
    if (skipAuth) return;
    if (authUser) return;
    if (authLoading) return;
    if (authError) {
      if (hadSession.current) {
        hadSession.current = false;
        router.replace("/login?reason=expired");
      } else {
        router.replace("/login");
      }
    }
  }, [isBare, authUser, authLoading, authError, router]);

  if (isBare) {
    return <>{children}</>;
  }

  if (skipAuth) {
    return <AppShell>{children}</AppShell>;
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
