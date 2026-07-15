import apiClient from "@/lib/axios";
import type { ApiResponse, CreateEmployeeRequest, Employee } from "@/features/admin/types";

const EMPLOYEE_PATH = "/api/employees";

/**
 * 직원 목록 조회
 * GET /api/employees
 */
export async function getEmployees(): Promise<Employee[]> {
  const { data } = await apiClient.get<ApiResponse<Employee[]>>(EMPLOYEE_PATH);
  return data.data ?? [];
}

/**
 * 직원 등록 (EMP + ACCOUNT)
 * POST /api/employees
 * password 평문은 서버에서 PW_HASH 로만 저장된다.
 */
export async function createEmployee(payload: CreateEmployeeRequest): Promise<Employee> {
  const { data } = await apiClient.post<ApiResponse<Employee>>(EMPLOYEE_PATH, payload);
  return data.data;
}
