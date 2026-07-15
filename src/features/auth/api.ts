import apiClient from "@/lib/axios";
import type { ApiResponse, LoginRequest, LoginResponse } from "@/features/auth/types";

const AUTH_LOGIN_PATH = "/api/auth/login";

/**
 * 로그인
 * POST /api/auth/login
 */
export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<ApiResponse<LoginResponse>>(AUTH_LOGIN_PATH, payload);
  return data.data;
}
