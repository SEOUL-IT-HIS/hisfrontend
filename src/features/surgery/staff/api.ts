/**
 * 직원 조회 API (수술 화면의 집도의·마취의·간호사 선택용)
 *
 * <p>admin-service 의 직원 목록을 프론트가 <b>직접</b> 호출한다(§2.1 — 수술 백엔드가
 * 대신 조회하면 BFF 가 되고, §21.1 "다른 서비스의 업무를 대신 수행하지 않는다"에도 어긋난다).</p>
 *
 * <p>경로·응답 필드는 features/admin(feature/front-management/ih2-12-employee 브랜치)의
 * 정의를 그대로 따랐다. 그 모듈이 develop 에 머지되면 이 파일을 지우고 features/admin 의
 * getEmployees 를 쓰도록 교체한다.</p>
 *
 * <p>조회만 둔다. 직원 등록·수정은 admin 서비스의 업무이므로 수술에서 제공하지 않는다(§21.2).</p>
 */
import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/surgery/types";
import type { Employee } from "@/features/surgery/staff/types";

const EMPLOYEE_PATH = "/api/employees";

/** 직원 목록을 조회한다. (GET /api/employees) */
export async function getEmployees(): Promise<Employee[]> {
  const { data } = await apiClient.get<ApiResponse<Employee[]>>(EMPLOYEE_PATH);
  return data.data;
}
