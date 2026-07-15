/** admin-service 로그인(ACCOUNT) 관련 타입 */

export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

export type AccountStatus = "ACTIVE" | "LOCKED" | "DISABLED";

export type LoginRequest = {
  loginId: string;
  password: string;
};

export type LoginResponse = {
  accountId: number;
  empId: number;
  empNo: string;
  name: string;
  loginId: string;
  accountStatus: AccountStatus | null;
};
