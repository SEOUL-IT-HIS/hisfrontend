import apiClient from "@/lib/axios";
import type {
  ApiResponse,
  EmsReferral,
  EwsRecord,
  IsolationAssessment,
  IsolationCreateRequest,
  KtasCreateRequest,
  KtasUpdateRequest,
  RiskScreening,
  RiskScreeningCreateRequest,
  TriageAssessment,
  VitalAssessmentCreateRequest,
} from "@/features/emergency/types";

/** ER-TRIAGE 공통 base path (백엔드 TriageController @RequestMapping) */
const TRIAGE_BASE = "/api/emergency/triage";

/**
 * 119 이송정보를 조회한다. UC-TRI-01 / Jira UD2-8
 * - receptionNo 를 넘기면 해당 접수건만, 생략하면 전체 목록을 반환한다. (백엔드 findByReceptionNo/findAll)
 * - 실패(HTTP 4xx/5xx)는 공통 axios interceptor 가 reject → saga 에서 처리.
 */
export async function getEmsInfo(receptionNo?: string): Promise<EmsReferral[]> {
  const { data } = await apiClient.get<ApiResponse<EmsReferral[]>>(`${TRIAGE_BASE}/ems-info`, {
    params: receptionNo ? { receptionNo } : undefined,
  });
  return data.data;
}

/** 접수건의 KTAS 분류/재평가 이력을 조회한다. UC-TRI-02/03 / Jira UD2-9, UD2-43 */
export async function getKtasHistory(receptionNo: string): Promise<TriageAssessment[]> {
  const { data } = await apiClient.get<ApiResponse<TriageAssessment[]>>(`${TRIAGE_BASE}/ktas`, {
    params: { receptionNo },
  });
  return data.data;
}

/** KTAS 최초 분류를 등록한다. UC-TRI-02 / Jira UD2-9 */
export async function createKtas(request: KtasCreateRequest): Promise<TriageAssessment> {
  const { data } = await apiClient.post<ApiResponse<TriageAssessment>>(`${TRIAGE_BASE}/ktas`, request);
  return data.data;
}

/** KTAS 재평가 — id 는 "무엇을 재평가하는지"의 기준이 되는 기존 분류 id. UC-TRI-03 / Jira UD2-43 */
export async function updateKtas(id: string, request: KtasUpdateRequest): Promise<TriageAssessment> {
  const { data } = await apiClient.put<ApiResponse<TriageAssessment>>(`${TRIAGE_BASE}/ktas/${id}`, request);
  return data.data;
}

/** 접수건의 활력징후(EWS) 이력을 조회한다. UC-TRI-04 / Jira UD2-10 */
export async function getVitalAssessments(receptionNo: string): Promise<EwsRecord[]> {
  const { data } = await apiClient.get<ApiResponse<EwsRecord[]>>(`${TRIAGE_BASE}/vital-assessments`, {
    params: { receptionNo },
  });
  return data.data;
}

/** 활력징후를 등록한다(다건 가능). UC-TRI-04 / Jira UD2-10 */
export async function createVitalAssessments(request: VitalAssessmentCreateRequest): Promise<EwsRecord[]> {
  const { data } = await apiClient.post<ApiResponse<EwsRecord[]>>(`${TRIAGE_BASE}/vital-assessments`, request);
  return data.data;
}

/** 접수건의 격리 등록/해제 이력을 조회한다. UC-TRI-05 / Jira UD2-11 */
export async function getIsolations(receptionNo: string): Promise<IsolationAssessment[]> {
  const { data } = await apiClient.get<ApiResponse<IsolationAssessment[]>>(
    `${TRIAGE_BASE}/infection-isolations`,
    { params: { receptionNo } },
  );
  return data.data;
}

/** 격리를 등록한다. UC-TRI-05 / Jira UD2-11 */
export async function createIsolation(request: IsolationCreateRequest): Promise<IsolationAssessment> {
  const { data } = await apiClient.post<ApiResponse<IsolationAssessment>>(
    `${TRIAGE_BASE}/infection-isolations`,
    request,
  );
  return data.data;
}

/** 격리를 해제한다(released_at 기록, 물리삭제 아님). UC-TRI-05 / Jira UD2-11 */
export async function releaseIsolation(id: string): Promise<IsolationAssessment> {
  const { data } = await apiClient.patch<ApiResponse<IsolationAssessment>>(
    `${TRIAGE_BASE}/infection-isolations/${id}/release`,
  );
  return data.data;
}

/** 접수건의 패혈증/뇌졸중 스크리닝 이력을 조회한다. UC-TRI-06 / Jira UD2-12 */
export async function getRiskScreenings(receptionNo: string): Promise<RiskScreening[]> {
  const { data } = await apiClient.get<ApiResponse<RiskScreening[]>>(`${TRIAGE_BASE}/risk-screenings`, {
    params: { receptionNo },
  });
  return data.data;
}

/** 위험 스크리닝 결과를 등록한다. UC-TRI-06 / Jira UD2-12 */
export async function createRiskScreening(request: RiskScreeningCreateRequest): Promise<RiskScreening> {
  const { data } = await apiClient.post<ApiResponse<RiskScreening>>(`${TRIAGE_BASE}/risk-screenings`, request);
  return data.data;
}
