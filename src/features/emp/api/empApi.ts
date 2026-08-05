/**
 * [직원 API]
 * admin-service REST 호출만 담당 (UI/Redux 모름)
 *
 * - 목록 GET  /api/emp/list
 * - 상세 GET  /api/emp/detail/{empId}
 * - 등록 POST /api/emp/register
 * - 수정 PUT  /api/emp/update/{empId}
 *
 * 응답은 ApiResponse 래퍼 → data 필드만 반환
 */
import apiClient from "@/lib/axios";
import type {
  ApiResponse,
  Emp,
  EmpApiResponse,
  EmpRegisterRequest,
  EmpUpdateRequest,
} from "../types/empTypes";

/** 직원 전체 목록 조회 */
export async function fetchEmpApi(): Promise<Emp[]> {
  const response = await apiClient.get<EmpApiResponse>("/api/emp/list");
  return response.data.data ?? [];
}

/** 직원 상세 조회 */
export async function fetchEmpDetailApi(empId: number): Promise<Emp> {
  const response = await apiClient.get<ApiResponse<Emp>>(
    `/api/emp/detail/${empId}`,
  );
  return response.data.data;
}

/** 직원 등록 — body: empNo, empName, empEmail, empPhone, hireDate, deptCode */
export async function fetchEmpRegisterApi(
  empData: EmpRegisterRequest,
): Promise<Emp> {
  const response = await apiClient.post<ApiResponse<Emp>>(
    "/api/emp/register",
    empData,
  );
  return response.data.data;
}

/**
 * 직원 수정
 * - Path: empId
 * - Body: empName, empEmail, empPhone, retireDate, empStatus, deptCode
 * - empNo 는 변경 불가
 */
export async function fetchEmpUpdateApi(empData: EmpUpdateRequest): Promise<Emp> {
  const { empId, empName, empEmail, empPhone, retireDate, empStatus, deptCode } =
    empData;
  const response = await apiClient.put<ApiResponse<Emp>>(
    `/api/emp/update/${empId}`,
    { empName, empEmail, empPhone, retireDate, empStatus, deptCode },
  );
  return response.data.data;
}
