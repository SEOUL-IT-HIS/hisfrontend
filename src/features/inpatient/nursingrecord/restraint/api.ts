import { ApiResponse } from "@/features/billing/types";
import apiClient from "@/lib/axios";
import { RestraintDTO, RegisterRestraintRequest, UpdateRestraintRequest } from "../types";

/** admissionId가 있으면 그 입원 건의 기록만, 없으면 전체 (axios는 undefined 파라미터를 보내지 않음) */
export async function fetchRestraintApi(admissionId?: string) {
  const { data } = await apiClient.get<ApiResponse<RestraintDTO[]>>("/api/inpatient/nursingrecord/restraint", { params: { admissionId } });

  return data.data;
}

export const fetchRestraintDetailApi = async (id: string) => {
  const { data } = await apiClient.get<ApiResponse<RestraintDTO>>(`/api/inpatient/nursingrecord/restraint/${id}`);

  return data.data;
};

export const createRestraintApi = async (request: RegisterRestraintRequest) => {
  const { data } = await apiClient.post<ApiResponse<RestraintDTO>>("/api/inpatient/nursingrecord/restraint", request);
  return data.data;
};

export const updateRestraintApi = async (request: UpdateRestraintRequest) => {
  const { data } = await apiClient.put<ApiResponse<RestraintDTO>>(`/api/inpatient/nursingrecord/restraint/${request.restraintId}`, request);
  return data.data;
};

export const deleteRestraintApi = async (id: string) => {
  const { data } = await apiClient.delete<ApiResponse<void>>(`/api/inpatient/nursingrecord/restraint/${id}`);
  return data.data;
};