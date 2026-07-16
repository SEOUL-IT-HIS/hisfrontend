import apiClient from "@/lib/axios";
import type { ApiResponse, LoginRequest, LoginResponse } from "@/features/auth/types";

const AUTH_LOGIN_PATH = "/api/auth/login";
const AUTH_LOGOUT_PATH = "/api/auth/logout";
const AUTH_ME_PATH = "/api/auth/me";

/**
 * 로그인
 * POST /api/auth/login
 * - BE 가 HttpSession 생성 + Set-Cookie(JSESSIONID)
 */
export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<ApiResponse<LoginResponse>>(AUTH_LOGIN_PATH, payload);
  return data.data;
}

/**
 * 로그아웃
 * POST /api/auth/logout
 * - BE HttpSession.invalidate()
 */
export async function logout(): Promise<void> {
  await apiClient.post<ApiResponse<null>>(AUTH_LOGOUT_PATH);
}

/**
 * 현재 로그인 사용자
 * GET /api/auth/me
 * - HttpSession 의 LOGIN_USER 조회 (서버 세션 검증)
 */
export async function fetchMe(): Promise<LoginResponse> {
  const { data } = await apiClient.get<ApiResponse<LoginResponse>>(AUTH_ME_PATH);
  return data.data;
}
