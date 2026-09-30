import { ApiResponse } from "@/features/billing/types";
import apiClient from "@/lib/axios";
import { NursingAssessmentDTO, RegisterNursingAssessmentRequest, UpdateNursingAssessmentRequest } from "../types";

export async function fetchNursingAssessmentApi() {
  const { data } = await apiClient.get<ApiResponse<NursingAssessmentDTO[]>>("/api/inpatient/nursingrecord/nursingassessment");

  return data.data;
}

export const fetchNursingAssessmentDetailApi = async (id: string) => {
  const { data } = await apiClient.get<ApiResponse<NursingAssessmentDTO>>(`/api/inpatient/nursingrecord/nursingassessment/${id}`);

  return data.data;
};

export const createNursingAssessmentApi = async (request: RegisterNursingAssessmentRequest) => {
  const { data } = await apiClient.post<ApiResponse<NursingAssessmentDTO>>("/api/inpatient/nursingrecord/nursingassessment", request);
  return data.data;
};

export const updateNursingAssessmentApi = async (request: UpdateNursingAssessmentRequest) => {
  const { data } = await apiClient.put<ApiResponse<NursingAssessmentDTO>>(`/api/inpatient/nursingrecord/nursingassessment/${request.nursingAssessmentId}`, request);
  return data.data;
};

export const deleteNursingAssessmentApi = async (id: string) => {
  const { data } = await apiClient.delete<ApiResponse<void>>(`/api/inpatient/nursingrecord/nursingassessment/${id}`);
  return data.data;
};