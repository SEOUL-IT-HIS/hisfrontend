/**
 * [인증 API]
 * admin-service REST 호출만 담당 (UI/Redux 모름)
 *
 * - 로그인 POST /api/auth/login
 * - 세션  GET  /api/auth/me
 * - 로그아웃 POST /api/auth/logout
 *
 * TODO: 실제 axios 호출 연결
 */
import type { AuthLoginRequest, AuthUser } from "../types/authTypes";

/** 로그인 */
export async function fetchAuthLoginApi(
  _payload: AuthLoginRequest,
): Promise<AuthUser> {
  throw new Error("authApi.login 미구현");
}

/** 세션 확인 */
export async function fetchAuthMeApi(): Promise<AuthUser> {
  throw new Error("authApi.me 미구현");
}

/** 로그아웃 */
export async function fetchAuthLogoutApi(): Promise<void> {
  throw new Error("authApi.logout 미구현");
}
