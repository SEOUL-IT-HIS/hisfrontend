import apiClient from "@/lib/axios";
import { ApiResponse } from "@/features/billing/types";
import type { PrescriptionDTO, PrescriptionCreateDTO } from "../types";

export const fetchPrescriptionsByAdmissionApi = async (admissionId: string) => {
  const { data } = await apiClient.get<ApiResponse<PrescriptionDTO[]>>(`/api/inpatient/prescription/admission/${admissionId}`);
  return data.data;
};

export const fetchPrescriptionDetailApi = async (prescriptionId: string) => {
  const { data } = await apiClient.get<ApiResponse<PrescriptionDTO>>(`/api/inpatient/prescription/${prescriptionId}`);
  return data.data;
};

export const createPrescriptionApi = async (admissionId: string, request: PrescriptionCreateDTO) => {
  const { data } = await apiClient.post<ApiResponse<PrescriptionDTO>>(`/api/inpatient/prescription/admission/${admissionId}`, request);
  return data.data;
};

// 전송 실패(SEND_FAILED) 항목만 검사실/약제부로 다시 전송 (등록 시 전송은 서버가 자동으로 함)
export const retryDispatchApi = async (prescriptionId: string) => {
  const { data } = await apiClient.post<ApiResponse<PrescriptionDTO>>(`/api/inpatient/prescription/${prescriptionId}/dispatch`);
  return data.data;
};

// 처방 취소 — 서버가 외래 처방코어에 취소 요청 후 병동 상태도 CANCELLED로 변경
export const cancelPrescriptionApi = async (prescriptionId: string, cancelReason: string) => {
  const { data } = await apiClient.patch<ApiResponse<PrescriptionDTO>>(`/api/inpatient/prescription/${prescriptionId}/cancel`, { cancelReason });
  return data.data;
};
