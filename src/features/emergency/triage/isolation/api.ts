import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/emergency/types";
import type { IsolationAssessment, IsolationCreateRequest } from "@/features/emergency/triage/isolation/types";

const ISOLATION_PATH = "/api/emergency/triage/infection-isolations";

/** 접수건의 격리 등록/해제 이력을 조회한다. UC-TRI-05 / Jira UD2-11 */
export async function getIsolations(receptionNo: string): Promise<IsolationAssessment[]> {
  const { data } = await apiClient.get<ApiResponse<IsolationAssessment[]>>(ISOLATION_PATH, {
    params: { receptionNo },
  });
  return data.data;
}

/** 격리를 등록한다. UC-TRI-05 / Jira UD2-11 */
export async function createIsolation(request: IsolationCreateRequest): Promise<IsolationAssessment> {
  const { data } = await apiClient.post<ApiResponse<IsolationAssessment>>(ISOLATION_PATH, request);
  return data.data;
}

/** 격리를 해제한다(released_at 기록, 물리삭제 아님). UC-TRI-05 / Jira UD2-11 */
export async function releaseIsolation(id: string): Promise<IsolationAssessment> {
  const { data } = await apiClient.patch<ApiResponse<IsolationAssessment>>(`${ISOLATION_PATH}/${id}/release`);
  return data.data;
}
