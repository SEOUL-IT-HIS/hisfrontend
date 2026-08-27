import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/reception/types";
import type {
  ReceptionListItem,
  ReceptionDetail,
  ReceptionListQuery,
  ReceptionRegisterRequest,
  ReceptionCancelRequest,
  DepartmentOption,
  DoctorOption,
} from "./types";

const RECEPTION_PATH = "/api/reception";
const DEPARTMENT_PATH = "/api/reception/departments";

export async function getReceptionList(
  query: ReceptionListQuery,
): Promise<ReceptionListItem[]> {
  const { data } = await apiClient.get<ApiResponse<ReceptionListItem[]>>(
    RECEPTION_PATH,
    { params: query },
  );
  return data.data;
}

export async function getReceptionDetail(
  receptionId: string,
): Promise<ReceptionDetail> {
  const { data } = await apiClient.get<ApiResponse<ReceptionDetail>>(
    `${RECEPTION_PATH}/${receptionId}`,
  );
  return data.data;
}

export async function registerReception(
  request: ReceptionRegisterRequest,
): Promise<ReceptionDetail> {
  const { data } = await apiClient.post<ApiResponse<ReceptionDetail>>(
    RECEPTION_PATH,
    request,
  );
  return data.data;
}

export async function cancelReception(
  request: ReceptionCancelRequest,
): Promise<void> {
  const { receptionId, ...body } = request;
  await apiClient.patch<ApiResponse<void>>(
    `${RECEPTION_PATH}/${receptionId}/cancel`,
    body,
  );
}

export async function getDepartments(): Promise<DepartmentOption[]> {
  const { data } =
    await apiClient.get<ApiResponse<DepartmentOption[]>>(DEPARTMENT_PATH);
  return data.data;
}

export async function getDoctors(deptId: string): Promise<DoctorOption[]> {
  const { data } = await apiClient.get<ApiResponse<DoctorOption[]>>(
    `${DEPARTMENT_PATH}/${deptId}/doctors`,
  );
  return data.data;
}
