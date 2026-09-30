/**
 * [인증 API]
 * admin-service REST 호출만 담당 (UI/Redux 모름)
 *
 * - 로그인 POST /api/admin/auth/login
 * - 세션  GET  /api/admin/auth/me
 * - 로그아웃 POST /api/admin/auth/logout
 * - 비밀번호 변경 PUT /api/admin/auth/password (IH2-115, 본인만·관리자 01 은 서버가 403)
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
    // 사이드바에서 볼 수 있는 메뉴를 거를 때 쓴다. 쉼표로 이어진 문자열이다.
    menuCodes: data.menuCodes ?? null,
    roleCodes: data.roleCodes ?? null,
  };
}

/** 로그인 */
export async function fetchAuthLoginApi(
  payload: AuthLoginRequest,
): Promise<AuthUser> {
  const response = await apiClient.post<ApiResponse<AuthUser>>(
    "/api/admin/auth/login",
    payload,
  );
  if (response.data.code !== 200 || !response.data.data) {
    throw new Error(response.data.message || "Sign-in failed.");
  }
  return toAuthUser(response.data.data);
}

/** 세션 확인 */
export async function fetchAuthMeApi(): Promise<AuthUser> {
  const response = await apiClient.get<ApiResponse<AuthUser>>("/api/admin/auth/me");
  if (response.data.code !== 200 || !response.data.data) {
    throw new Error(response.data.message || "Please sign in.");
  }
  return toAuthUser(response.data.data);
}

/** 로그아웃 */
export async function fetchAuthLogoutApi(): Promise<void> {
  const response = await apiClient.post<ApiResponse<null>>("/api/admin/auth/logout");
  if (response.data.code !== 200) {
    throw new Error(response.data.message || "Sign-out failed.");
  }
}

/**
 * 비밀번호 변경 (본인)
 * 누구의 비밀번호인지는 보내지 않는다. 서버가 세션의 로그인 사용자로 정한다.
 * 현재 비밀번호가 틀리면 서버가 400 을 준다(401 이 아니라 로그아웃되지 않는다).
 */
export async function changePasswordApi(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const response = await apiClient.put<ApiResponse<null>>("/api/admin/auth/password", {
    currentPassword,
    newPassword,
  });
  if (response.data.code !== 200) {
    throw new Error(response.data.message || "Failed to change the password.");
  }
}
