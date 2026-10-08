import { ApiResponse } from "@/features/billing/types";
import apiClient from "@/lib/axios";
import { NursingAssessmentDTO, RegisterNursingAssessmentRequest, UpdateNursingAssessmentRequest } from "../types";

/** admissionId가 있으면 그 입원 건의 기록만, 없으면 전체 (axios는 undefined 파라미터를 보내지 않음) */
export async function fetchNursingAssessmentApi(admissionId?: string) {
  const { data } = await apiClient.get<ApiResponse<NursingAssessmentDTO[]>>("/api/inpatient/nursingrecord/nursingassessment", { params: { admissionId } });

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