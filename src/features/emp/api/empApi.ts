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
export async function fetchEmpDetailApi(empId: string): Promise<Emp> {
  const response = await apiClient.get<ApiResponse<Emp>>(
    `/api/emp/detail/${empId}`,
  );
  return response.data.data;
}

/** 직원 등록 — dto(JSON) + image(파일)를 multipart로 전송 */
export async function fetchEmpRegisterApi(
    empData: EmpRegisterRequest,
): Promise<Emp> {
  const { image, ...dto } = empData;
  const formData = new FormData();
  formData.append(
      "dto",
      new Blob([JSON.stringify(dto)], { type: "application/json" }),
  );
  if (image) {
    formData.append("image", image);
  }

  const response = await apiClient.post<ApiResponse<Emp>>(
      "/api/emp/register",
      formData,
      { headers: { "Content-Type": undefined } },
  );
  return response.data.data;
}

/**
 * 직원 수정
 * - Path: empId
 * - Body: empName, empEmail, empPhone, retireDate, empStatus, deptCode (dto 파트)
 * - image: 선택 시에만 image 파트로 같이 전송
 */
export async function fetchEmpUpdateApi(empData: EmpUpdateRequest): Promise<Emp> {
  const { empId, image, ...dto } = empData;
  const formData = new FormData();
  formData.append(
      "dto",
      new Blob([JSON.stringify(dto)], { type: "application/json" }),
  );
  if (image) {
    formData.append("image", image);
  }

  const response = await apiClient.put<ApiResponse<Emp>>(
      `/api/emp/update/${empId}`,
      formData,
      { headers: { "Content-Type": undefined } },
  );
  return response.data.data;
}
