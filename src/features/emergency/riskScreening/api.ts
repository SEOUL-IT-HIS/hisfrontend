import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/emergency/types";
import type { RiskScreening, RiskScreeningCreateRequest } from "@/features/emergency/riskScreening/types";

const RISK_SCREENING_PATH = "/api/emergency/triage/risk-screenings";

/** 접수건의 패혈증/뇌졸중 스크리닝 이력을 조회한다. UC-TRI-06 / Jira UD2-12 */
export async function getRiskScreenings(receptionNo: string): Promise<RiskScreening[]> {
  const { data } = await apiClient.get<ApiResponse<RiskScreening[]>>(RISK_SCREENING_PATH, {
    params: { receptionNo },
  });
  return data.data;
}

/** 위험 스크리닝 결과를 등록한다. UC-TRI-06 / Jira UD2-12 */
export async function createRiskScreening(request: RiskScreeningCreateRequest): Promise<RiskScreening> {
  const { data } = await apiClient.post<ApiResponse<RiskScreening>>(RISK_SCREENING_PATH, request);
  return data.data;
}
