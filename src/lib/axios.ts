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
     * /api/auth/ 로 시작하는 요청은 제외한다 — 두 가지 이유가 있다.
     * 1. 로그인 실패(비밀번호 틀림)도 401 이다. 여기서 가로채면 로그인 화면이
     *    "아이디 또는 비밀번호가 올바르지 않습니다" 를 못 보여주고 새로고침만 된다.
     * 2. 세션 확인(/api/auth/me) 실패는 AppFrame 이 처리한다. 거기서는 "첫 진입"인지
     *    "쓰다가 만료"인지를 구분해서 안내 문구를 다르게 붙인다.
     *
     * router 가 아니라 window.location 을 쓰는 이유: 여기는 React 바깥이라 router 를
     * 쓸 수 없다. 페이지가 통째로 새로 뜨면서 이전 사용자의 Redux 데이터도 함께 사라진다.
     * (typeof window 검사는 이 파일이 서버에서 실행될 때를 대비한 것이다)
     */
    if (
      status === 401 &&
      !url.startsWith("/api/auth/") &&
      typeof window !== "undefined"
    ) {
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
