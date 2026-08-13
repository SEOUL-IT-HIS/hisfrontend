import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/emergency/types";
import type {
  KtasCreateRequest,
  KtasLevelCode,
  KtasUpdateRequest,
  TriageAssessment,
} from "@/features/emergency/ktas/types";

const KTAS_PATH = "/api/emergency/triage/ktas";
const KTAS_LEVEL_CODE_PATH = "/api/emergency/codes/common/KTAS_LEVEL";

/**
 * KTAS 등급 공통코드를 조회한다.
 * emergency-service 가 서버 기동 시 admin-service 에서 미리 캐싱해둔 값을 내려준다
 * (admin 을 매 요청마다 직접 호출하지 않음). UD2-51.
 */
export async function getKtasLevelCodes(): Promise<KtasLevelCode[]> {
  const { data } = await apiClient.get<ApiResponse<KtasLevelCode[]>>(KTAS_LEVEL_CODE_PATH);
  return data.data;
}

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
