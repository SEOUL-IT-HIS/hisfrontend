import apiClient from "@/lib/axios";
import type { ApiResponse, VitalSignDTO } from "../types";
import type { RegisterVitalSignRequest, UpdateVitalSignRequest } from "../types";
export async function fetchVitalSignApi() {
  const { data } = await apiClient.get<ApiResponse<VitalSignDTO[]>>("/api/vitalsign");

  return data.data;
}

export const fetchVitalSignDetailApi = async (id: string) => {
  const { data } = await apiClient.get<ApiResponse<VitalSignDTO>>(`/api/vitalsign/${id}`);

  return data.data;
};

export const createVitalSignApi = async (request: RegisterVitalSignRequest) => {
  const { data } = await apiClient.post<ApiResponse<VitalSignDTO>>("/api/vitalsign", request);
  return data.data;
};

export const updateVitalSignApi = async (request: UpdateVitalSignRequest) => {
  const { data } = await apiClient.put<ApiResponse<VitalSignDTO>>(`/api/vitalsign/${request.vitalSignId}`, request);
  return data.data;
};

export const updateVitalSignScheduleApi = async (id: string, request: { reserveAt: string; expectedAdmissionAt: string }) => {
  const { data } = await apiClient.patch<ApiResponse<VitalSignDTO>>(`/api/vitalsign/${id}`, request);
  return data.data;
}

export const deleteVitalSignApi = async (id: string) => {
  const { data } = await apiClient.delete<ApiResponse<void>>(`/api/vitalsign/${id}`);
  return data.data;
};