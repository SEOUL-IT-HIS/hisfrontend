import apiClient from "@/lib/axios";
import type { ApiResponse, VitalSignDTO, VitalSignHistoryDTO } from "../types";
import type { RegisterVitalSignRequest, UpdateVitalSignRequest } from "../types";
/** admissionId가 있으면 그 입원 건의 기록만, 없으면 전체 (axios는 undefined 파라미터를 보내지 않음) */
export async function fetchVitalSignApi(admissionId?: string) {
  const { data } = await apiClient.get<ApiResponse<VitalSignDTO[]>>("/api/inpatient/nursingrecord/vitalsign", { params: { admissionId } });

  return data.data;
}

export const fetchVitalSignDetailApi = async (id: string) => {
  const { data } = await apiClient.get<ApiResponse<VitalSignDTO>>(`/api/inpatient/nursingrecord/vitalsign/${id}`);

  return data.data;
};

export const createVitalSignApi = async (request: RegisterVitalSignRequest) => {
  const { data } = await apiClient.post<ApiResponse<VitalSignDTO>>("/api/inpatient/nursingrecord/vitalsign", request);
  return data.data;
};

export const updateVitalSignApi = async (request: UpdateVitalSignRequest) => {
  const { data } = await apiClient.put<ApiResponse<VitalSignDTO>>(`/api/inpatient/nursingrecord/vitalsign/${request.vitalSignId}`, request);
  return data.data;
};

export const updateVitalSignScheduleApi = async (id: string, request: { reserveAt: string; expectedAdmissionAt: string }) => {
  const { data } = await apiClient.patch<ApiResponse<VitalSignDTO>>(`/api/inpatient/nursingrecord/vitalsign/${id}`, request);
  return data.data;
}

export const deleteVitalSignApi = async (id: string) => {
  const { data } = await apiClient.delete<ApiResponse<void>>(`/api/inpatient/nursingrecord/vitalsign/${id}`);
  return data.data;
};
export const fetchVitalSignHistoryApi = async (vitalSignId: string) => {
  const { data } = await apiClient.get<ApiResponse<VitalSignHistoryDTO[]>>(
    `/api/inpatient/nursingrecord/vitalsign/${vitalSignId}/history`
  );
  return data.data;
};