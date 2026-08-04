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
    const message =
      error.response?.data?.message ??
      error.message ??
      "요청 처리 중 오류가 발생했습니다.";

    return Promise.reject(new Error(String(message)));
  },
);

export default apiClient;
