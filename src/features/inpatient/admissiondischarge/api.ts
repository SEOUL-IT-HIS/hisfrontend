import apiClient from "@/lib/axios";
import type { ApiResponse, AdmissionDTO } from "./types";
import type { RegisterAdmissionRequest, UpdateAdmissionRequest } from "./types";

export async function fetchAdmissionApi() {
  const { data } = await apiClient.get<ApiResponse<AdmissionDTO[]>>("/api/admission");

  return data.data;
}

export const fetchAdmissionDetailApi = async (id: string) => {
  const { data } = await apiClient.get<ApiResponse<AdmissionDTO>>(`/api/admission/${id}`);

  return data.data;
};

export const createAdmissionApi = async (request: RegisterAdmissionRequest) => {
  const { data } = await apiClient.post<ApiResponse<AdmissionDTO>>("/api/admission", request);
  return data.data;
};

export const updateAdmissionApi = async (request: UpdateAdmissionRequest) => {
  const { data } = await apiClient.put<ApiResponse<AdmissionDTO>>(`/api/admission/${request.admissionId}`, request);
  return data.data;
};

export const deleteAdmissionApi = async (id: string) => {
  const { data } = await apiClient.delete<ApiResponse<void>>(`/api/admission/${id}`);
  return data.data;
};

export const changeAdmissionStatusApi = async (admissionId: string, status: string) => {
  const { data } = await apiClient.patch<ApiResponse<AdmissionDTO>>(`/api/admission/${admissionId}/status`, { status });
  return data.data;
};