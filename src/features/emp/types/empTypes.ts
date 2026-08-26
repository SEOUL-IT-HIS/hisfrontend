/**
 * [직원 타입]
 * admin-service EmpEntity / EmpDto 와 필드명 맞춤
 */

/** API 공통 응답 래퍼 { code, message, data } */
export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

/** 직원 한 행 (목록/등록/수정 응답) */
export type Emp = {
  empId: string;
  empNo: string;
  empName: string;
  empEmail: string | null;
  empPhone: string | null;
  hireDate: string | null;
  retireDate: string | null;
  empStatus: string | null;
  deptCode: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  profileImageUrl: string | null;
  zipCode: string | null;
  address: string | null;
  addressDetail: string | null;
};

/**
 * 직원 등록 요청
 * - createEmp 가 실제 사용하는 필드만
 * - empNo 는 서버에서 자동채번 (연도별 리셋) 되므로 요청에 포함하지 않음
 */
export type EmpRegisterRequest = {
  empName: string;
  empEmail?: string;
  empPhone?: string;
  hireDate?: string;
  deptCode?: string;
  zipCode?: string;
  address?: string;
  addressDetail?: string;
  image?: File;
};

/**
 * 직원 수정 요청
 * - empNo 는 식별키라 수정 API body 에 넣지 않음
 */
export type EmpUpdateRequest = {
  empId: string;
  empName: string;
  empEmail?: string;
  empPhone?: string;
  retireDate?: string;
  empStatus?: string;
  deptCode?: string;
  zipCode?: string;
  address?: string;
  addressDetail?: string;
  image?: File;
};

export type EmpApiResponse = ApiResponse<Emp[]>;
