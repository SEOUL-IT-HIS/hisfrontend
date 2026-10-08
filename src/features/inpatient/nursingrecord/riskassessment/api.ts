import apiClient from "@/lib/axios";
import { ApiResponse, RiskAssessmentDTO, RegisterRiskAssessmentRequest, UpdateRiskAssessmentRequest } from "../types";

/** admissionId가 있으면 그 입원 건의 기록만, 없으면 전체 (axios는 undefined 파라미터를 보내지 않음) */
export async function fetchRiskAssessmentApi(admissionId?: string) {
  const { data } = await apiClient.get<ApiResponse<RiskAssessmentDTO[]>>("/api/inpatient/nursingrecord/riskassessment", { params: { admissionId } });

  return data.data;
}

export const fetchRiskAssessmentDetailApi = async (id: string) => {
  const { data } = await apiClient.get<ApiResponse<RiskAssessmentDTO>>(`/api/inpatient/nursingrecord/riskassessment/${id}`);

  return data.data;
};

export const createRiskAssessmentApi = async (request: RegisterRiskAssessmentRequest) => {
  const { data } = await apiClient.post<ApiResponse<RiskAssessmentDTO>>("/api/inpatient/nursingrecord/riskassessment", request);
  return data.data;
};

export const updateRiskAssessmentApi = async (request: UpdateRiskAssessmentRequest) => {
  const { data } = await apiClient.put<ApiResponse<RiskAssessmentDTO>>(`/api/inpatient/nursingrecord/riskassessment/${request.patientRiskAssessmentId}`, request);
  return data.data;
};

export const deleteRiskAssessmentApi = async (id: string) => {
  const { data } = await apiClient.delete<ApiResponse<void>>(`/api/inpatient/nursingrecord/riskassessment/${id}`);
  return data.data;
};