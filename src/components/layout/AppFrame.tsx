"use client";

import AppShell from "@/components/layout/AppShell";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAuthMeRequest } from "@/features/auth/slice/authSlice";
import { setHasSession } from "@/lib/axios";
import type { AppDispatch, RootState } from "@/store/store";

type AppFrameProps = {
  children: React.ReactNode;
};

/** 사이드바/헤더 없이 보여주는 경로 (로그인 등) */
const BARE_PATHS = ["/login"];
const ACTIVITY_CHECK_INTERVAL = 1000 * 60 * 5;

/**
 * 공통 레이아웃 프레임
 * - /login : AppShell 없이 폼만
 * - 그 외 : 세션 확인(GET /api/auth/me) 후 인증되면 Sidebar+Header, 아니면 /login 이동
 *
 * 로그인 우회 수단은 두지 않는다. 예전에는 화면 확인용으로 특정 경로를 BARE_PATHS 에
 * 넣거나 NEXT_PUBLIC_SKIP_AUTH 로 가드를 통째로 끌 수 있었는데, 백엔드가 세션 없는
 * 요청을 401 로 막게 되면서(AuthSessionInterceptor) 우회해봐야 데이터가 오지 않는다.
 * 화면 껍데기만 열리는 경로를 남겨두면 언젠가 다시 켜지기만 한다.
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
    if (authUser) return;
    if (authLoading) return;
    if (meChecked.current) return;
    meChecked.current = true;
    dispatch(fetchAuthMeRequest());
  }, [isBare, authUser, authLoading, dispatch]);

  // authUser가 채워질 때마다(최초 로그인 성공이든, 활동으로 인한 재확인 성공이든)
  // "로그인된 적 있음" 표시 + 다음 활동 확인 기준 시각을 갱신한다
  useEffect(() => {
    // axios 인터셉터에도 알려준다. 인터셉터는 React 바깥이라 Redux 를 못 읽는데,
    // 로그인 전에 나가는 요청(외래 공통코드 saga 등)의 401 을 "세션 만료"로 오해하면
    // 로그인한 적도 없는데 만료 안내가 뜬다. lib/axios 의 setHasSession 주석 참고.
    setHasSession(Boolean(authUser));

    if (authUser) {
      hadSession.current = true;
      lastActivityCheckAt.current = Date.now();
    }
  }, [authUser]);

  // 로그인 상태일 때만 클릭/키입력을 감지해서, ACTIVITY_CHECK_INTERVAL 넘게 재확인 안 했으면
  // /api/auth/me 를 다시 호출한다 (고정 간격 폴링이 아니라 "활동이 있을 때만" 확인).
  useEffect(() => {
    if (isBare) return;
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
