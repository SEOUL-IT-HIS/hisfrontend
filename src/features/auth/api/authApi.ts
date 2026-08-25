/**
 * [인증 API]
 * admin-service REST 호출만 담당 (UI/Redux 모름)
 *
 * - 로그인 POST /api/auth/login
 * - 세션  GET  /api/auth/me
 * - 로그아웃 POST /api/auth/logout
 *
 * 세션 쿠키(JSESSIONID)는 apiClient withCredentials 로 전달
 */
import apiClient from "@/lib/axios";
import type { ApiResponse, AuthLoginRequest, AuthUser } from "../types/authTypes";

/** BE AuthDto → 프론트 AuthUser (pwHash 등 제외) */
function toAuthUser(data: AuthUser): AuthUser {
  return {
    accountId: data.accountId,
    empId: data.empId,
    loginId: data.loginId,
    empName: data.empName ?? null,
    empNo: data.empNo ?? null,
    deptCode: data.deptCode ?? null,
    accountStatus: data.accountStatus ?? null,
  };
}

/** 로그인 */
export async function fetchAuthLoginApi(
  payload: AuthLoginRequest,
): Promise<AuthUser> {
  const response = await apiClient.post<ApiResponse<AuthUser>>(
    "/api/auth/login",
    payload,
  );
  if (response.data.code !== 200 || !response.data.data) {
    throw new Error(response.data.message || "로그인에 실패했습니다.");
  }
  return toAuthUser(response.data.data);
}

/** 세션 확인 */
export async function fetchAuthMeApi(): Promise<AuthUser> {
  const response = await apiClient.get<ApiResponse<AuthUser>>("/api/auth/me");
  if (response.data.code !== 200 || !response.data.data) {
    throw new Error(response.data.message || "로그인이 필요합니다.");
  }
  return toAuthUser(response.data.data);
}

/** 로그아웃 */
export async function fetchAuthLogoutApi(): Promise<void> {
  const response = await apiClient.post<ApiResponse<null>>("/api/auth/logout");
  if (response.data.code !== 200) {
    throw new Error(response.data.message || "로그아웃에 실패했습니다.");
  }
}
