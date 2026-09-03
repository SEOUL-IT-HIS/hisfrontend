import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/emergency/types";
import type { EwsRecord, VitalAssessmentCreateRequest } from "@/features/emergency/triage/vitals/types";

const VITALS_PATH = "/api/emergency/triage/vital-assessments";

/** 접수건의 활력징후(EWS) 이력을 조회한다. UC-TRI-04 / Jira UD2-10 */
export async function getVitalAssessments(receptionNo: string): Promise<EwsRecord[]> {
  const { data } = await apiClient.get<ApiResponse<EwsRecord[]>>(VITALS_PATH, {
    params: { receptionNo },
  });
  return data.data;
}

/** 활력징후를 등록한다(다건 가능). UC-TRI-04 / Jira UD2-10 */
export async function createVitalAssessments(request: VitalAssessmentCreateRequest): Promise<EwsRecord[]> {
  const { data } = await apiClient.post<ApiResponse<EwsRecord[]>>(VITALS_PATH, request);
  return data.data;
}
