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
