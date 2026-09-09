import axios from "axios";

/**
 * 공통 axios instance
 *
 * baseURL:
 * - 기본 "" → 같은 출처(/api/...) → next.config rewrite → BE
 * - NEXT_PUBLIC_ADMIN_API_BASE_URL 을 쓰면 BE 직접 호출 (크로스 오리진 시 쿠키 주의)
 *
 * withCredentials: true
 * - 요청/응답에 쿠키(JSESSIONID)를 포함
 */
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? "",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
  withCredentials: true,
});

/*
 * 이미 로그인 화면으로 보내는 중인지 기억해 둔다.
 *
 * 화면 하나가 API 를 여러 개 동시에 부르면(메뉴 + 목록 + 공통코드 …) 세션이 끊겼을 때
 * 401 도 동시에 여러 개 도착한다. 그때마다 window.location.href 에 값을 다시 넣으면
 * 진행 중이던 이동이 취소되고 새로 시작되는데, 응답이 계속 오는 동안 이게 반복되면
 * 페이지가 끝내 안 뜨고 로그인 화면만 계속 다시 요청된다(무한 루프).
 * 한 번 보내기로 정했으면 그 뒤에 오는 401 은 무시한다.
 *
 * 모듈 스코프 변수라 페이지가 새로 뜨면 자동으로 false 로 돌아간다.
 */
let redirectingToLogin = false;

/*
 * 지금 로그인 상태인지. AppFrame 이 알려준다(setHasSession).
 *
 * 로그인 전에도 API 를 부르는 화면이 있다. 예를 들어 외래 공통코드 saga 는 앱이 뜨자마자
 * /api/admin/commonCodeGroup/list 를 부르는데, 세션 가드가 붙은 뒤로는 이게 401 이 된다.
 * 그걸 "세션 만료"로 보고 로그인 화면으로 보내면, 로그인한 적도 없는데 만료 안내가 뜬다.
 * 만료는 "로그인해서 쓰고 있다가 끊긴 것"이므로 로그인 상태였을 때만 보낸다.
 *
 * Redux 를 직접 읽지 않는 이유: 여기서 store 를 import 하면
 * store → saga → api → axios → store 로 순환 import 가 된다. 값만 넘겨받는다.
 */
let hasSession = false;

export function setHasSession(value: boolean) {
  hasSession = value;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? "";

    /*
     * 세션이 끊긴 상태(401)면 로그인 화면으로 보낸다.
     * 백엔드 AuthSessionInterceptor 가 로그인 안 된 요청을 401 로 막기 때문에,
     * 세션이 만료되면 어느 화면에서든 여기로 들어온다.
     *
     * 보내지 않는 경우가 넷 있다.
     * 1. 로그인 상태가 아닐 때 — 위 hasSession 주석 참고. 로그인 전 401 은 만료가 아니다.
     * 2. /api/admin/auth/ 요청 — 로그인 실패(비밀번호 틀림)도 401 이라, 여기서 가로채면
     *    로그인 화면이 "아이디 또는 비밀번호가 올바르지 않습니다" 를 못 보여준다.
     *    세션 확인(/api/admin/auth/me) 실패는 AppFrame 이 "첫 진입"인지 "쓰다가 만료"인지
     *    구분해 안내 문구를 다르게 붙이므로 거기에 맡긴다.
     * 3. 이미 로그인 화면에 있을 때 — 같은 자리로 다시 보낼 이유가 없다.
     * 4. 이미 보내는 중일 때 — 위 redirectingToLogin 주석 참고.
     *
     * router 가 아니라 window.location 을 쓰는 이유: 여기는 React 바깥이라 router 를
     * 쓸 수 없다. 페이지가 통째로 새로 뜨면서 이전 사용자의 Redux 데이터도 함께 사라진다.
     * (typeof window 검사는 이 파일이 서버에서 실행될 때를 대비한 것이다)
     */
    if (
      status === 401 &&
      hasSession &&
      !url.startsWith("/api/admin/auth/") &&
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login") &&
      !redirectingToLogin
    ) {
      redirectingToLogin = true;
      window.location.href = "/login?reason=expired";
    }

    const message =
      error.response?.data?.message ??
      error.message ??
      "요청 처리 중 오류가 발생했습니다.";

    return Promise.reject(new Error(String(message)));
  },
);

export default apiClient;
