/** admin-service 직원(EMP) + 계정(ACCOUNT) + 메뉴(MENU) 관련 타입 */

/** 공통 API 응답 포맷 (개발표준가이드 11.3) */
export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

export type EmpStatus = "ACTIVE" | "LEAVE" | "RETIRED";

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
  empStatus: EmpStatus | null;
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
  /** ACTIVE | LEAVE | RETIRED */
  empStatus?: EmpStatus;
  deptCode?: string;
};

export const EMP_STATUS_OPTIONS: { value: EmpStatus; label: string }[] = [
  { value: "ACTIVE", label: "재직" },
  { value: "LEAVE", label: "휴직" },
  { value: "RETIRED", label: "퇴직" },
];

/** 부서 코드 임시 옵션 (공통코드 API 연동 전) */
export const DEPT_CODE_OPTIONS: { value: string; label: string }[] = [
  { value: "ADMIN", label: "원무/관리" },
  { value: "OPD", label: "외래" },
  { value: "WARD", label: "병동" },
  { value: "LAB", label: "검사/영상" },
  { value: "PHARM", label: "약국" },
];

/**
 * admin-service GET /api/menus 트리 노드
 * - parentMenuId null → L0 업무영역
 * - children → L1 기능 메뉴
 */
export type MenuNode = {
  menuId: number;
  parentMenuId: number | null;
  menuCode: string;
  menuName: string;
  menuUrl: string | null;
  areaKey: string | null;
  serviceCode: string | null;
  sortOrder: number | null;
  children: MenuNode[];
};
