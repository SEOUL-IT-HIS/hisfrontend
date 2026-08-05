/**
 * 수술 동의서 API (SL2-42)
 *
 * <p>백엔드 ConsentController(@RequestMapping("/api/surgery")) 와 1:1 대응.</p>
 *
 * <p>수정 API 가 없는 이유 — 동의서는 서명 시점의 사실 기록이라 고쳐 쓰지 않는다.
 * 내용이 바뀌면 새로 동의를 받아 다른 행으로 남긴다(§21.6). 백엔드도 PUT 을 열지 않는다.</p>
 */
import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/surgery/types";
import type {
  Consent,
  CreateConsentRequest,
} from "@/features/surgery/consent/types";

const SURGERY_PATH = "/api/surgery";

/** 해당 수술의 동의서 목록을 조회한다. (SL2-54) */
export async function getConsents(surgeryId: string): Promise<Consent[]> {
  const { data } = await apiClient.get<ApiResponse<Consent[]>>(
    `${SURGERY_PATH}/${surgeryId}/consents`,
  );
  return data.data;
}

/** 환자별 동의서 이력을 조회한다. (SL2-222) */
export async function getConsentsByPatient(
  patientId: string,
): Promise<Consent[]> {
  const { data } = await apiClient.get<ApiResponse<Consent[]>>(
    `${SURGERY_PATH}/consents`,
    { params: { patientId } },
  );
  return data.data;
}

/** 동의서 단건을 조회한다. */
export async function getConsent(consentId: string): Promise<Consent> {
  const { data } = await apiClient.get<ApiResponse<Consent>>(
    `${SURGERY_PATH}/consents/${consentId}`,
  );
  return data.data;
}

/** 수술 동의를 확인 기록한다. (SL2-53) */
export async function createConsent(
  surgeryId: string,
  request: CreateConsentRequest,
): Promise<Consent> {
  const { data } = await apiClient.post<ApiResponse<Consent>>(
    `${SURGERY_PATH}/${surgeryId}/consents`,
    request,
  );
  return data.data;
}
