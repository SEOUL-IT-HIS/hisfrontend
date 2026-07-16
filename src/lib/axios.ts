import axios from "axios";

/**
 * 공통 axios instance (초안)
 * - baseURL: NEXT_PUBLIC_ADMIN_API_BASE_URL (예: http://localhost:8081)
 * - Token / 공통 interceptor는 프론트 리더 관리 영역 (개발표준가이드 11.1)
 */
/**
 * 팀 기본값: MSA 기동 PC (192.168.1.128:8080)
 * 개인 PC에서만 쓰려면 .env.local 에 NEXT_PUBLIC_ADMIN_API_BASE_URL 설정
 */
const apiClient = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? "http://192.168.1.128:8080",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
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
