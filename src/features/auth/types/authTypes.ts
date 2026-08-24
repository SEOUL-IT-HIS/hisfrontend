/**
 * [인증 타입]
 * admin-service AuthDto / AuthRequestDto 와 맞춤
 */

/** API 공통 응답 래퍼 */
export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

/** 로그인 요청 — POST /api/auth/login */
export type AuthLoginRequest = {
  loginId: string;
  password: string;
};

/** 로그인 / me 응답 사용자 */
export type AuthUser = {
  accountId: string;
  empId: string;
  loginId: string;
  empName: string | null;
  empNo: string | null;
  deptCode: string | null;
  accountStatus: string | null;
};
