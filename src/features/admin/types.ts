/** admin-service 직원(EMP) + 계정(ACCOUNT) 관련 타입 */

/** 공통 API 응답 포맷 (개발표준가이드 11.3) */
export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

/** 공통코드 EMP_STATUS_CD 코드값 (01=재직, 02=휴직, 03=퇴직) */
export type EmpStatus = string;

export type AccountStatus = "ACTIVE" | "LOCKED" | "DISABLED";

/** 직원 조회/목록 행 */
export type Employee = {
  empId: number;
  empNo: string;
  name: string;
  email: string | null;
  phone: string | null;
  hireDate: string | null;
  retireDate: string | null;
  /** 공통코드 EMP_STATUS_CD */
  empStatus: EmpStatus | null;
  /** 공통코드 DEPT_CD */
  deptCode: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  /** ACCOUNT.LOGIN_ID */
  loginId: string;
  accountStatus: AccountStatus | null;
};

/**
 * 직원등록 요청
 * - EMP: 직원 마스터
 * - ACCOUNT: loginId + password(평문) → 서버에서 PW_HASH로 저장
 */
export type CreateEmployeeRequest = {
  empNo: string;
  name: string;
  email?: string;
  phone?: string;
  hireDate?: string;
  empStatus?: EmpStatus;
  deptCode?: string;
  loginId: string;
  password: string;
};

/**
 * 직원 수정 요청
 * - empNo / loginId 는 식별값이므로 수정 범위에서 제외
 * - password 변경은 별도 API 로 처리
 */
export type UpdateEmployeeRequest = {
  name: string;
  email?: string;
  phone?: string;
  /** yyyy-MM-dd */
  hireDate?: string;
  /** yyyy-MM-dd */
  retireDate?: string;
  /** 공통코드 EMP_STATUS_CD */
  empStatus?: EmpStatus;
  deptCode?: string;
};
