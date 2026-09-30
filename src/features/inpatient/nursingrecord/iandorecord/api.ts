import { ApiResponse } from "@/features/billing/types";
import apiClient from "@/lib/axios";
import { IandORecordDTO, RegisterIandORecordRequest, UpdateIandORecordRequest } from "../types";

export async function fetchIandORecordApi() {
  const { data } = await apiClient.get<ApiResponse<IandORecordDTO[]>>("/api/inpatient/nursingrecord/iandorecord");

  return data.data;
}

export const fetchIandORecordDetailApi = async (id: string) => {
  const { data } = await apiClient.get<ApiResponse<IandORecordDTO>>(`/api/inpatient/nursingrecord/iandorecord/${id}`);

  return data.data;
};

export const createIandORecordApi = async (request: RegisterIandORecordRequest) => {
  const { data } = await apiClient.post<ApiResponse<IandORecordDTO>>("/api/inpatient/nursingrecord/iandorecord", request);
  return data.data;
};

export const updateIandORecordApi = async (request: UpdateIandORecordRequest) => {
  const { data } = await apiClient.put<ApiResponse<IandORecordDTO>>(`/api/inpatient/nursingrecord/iandorecord/${request.intakeOutputId}`, request);
  return data.data;
};

export const deleteIandORecordApi = async (id: string) => {
  const { data } = await apiClient.delete<ApiResponse<void>>(`/api/inpatient/nursingrecord/iandorecord/${id}`);
  return data.data;
};