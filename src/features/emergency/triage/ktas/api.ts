import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/emergency/types";
import type { KtasCreateRequest, KtasUpdateRequest, TriageAssessment } from "@/features/emergency/triage/ktas/types";

const KTAS_PATH = "/api/emergency/triage/ktas";

/** 접수건의 KTAS 분류/재평가 이력을 조회한다. UC-TRI-02/03 / Jira UD2-9, UD2-43 */
export async function getKtasHistory(receptionNo: string): Promise<TriageAssessment[]> {
  const { data } = await apiClient.get<ApiResponse<TriageAssessment[]>>(KTAS_PATH, {
    params: { receptionNo },
  });
  return data.data;
}

/** KTAS 최초 분류를 등록한다. UC-TRI-02 / Jira UD2-9 */
export async function createKtas(request: KtasCreateRequest): Promise<TriageAssessment> {
  const { data } = await apiClient.post<ApiResponse<TriageAssessment>>(KTAS_PATH, request);
  return data.data;
}

/** KTAS 재평가 — id 는 "무엇을 재평가하는지"의 기준이 되는 기존 분류 id. UC-TRI-03 / Jira UD2-43 */
export async function updateKtas(id: string, request: KtasUpdateRequest): Promise<TriageAssessment> {
  const { data } = await apiClient.put<ApiResponse<TriageAssessment>>(`${KTAS_PATH}/${id}`, request);
  return data.data;
}
