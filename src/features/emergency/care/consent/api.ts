import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/emergency/types";
import type { ConsentRecord, ConsentRecordCreateRequest } from "@/features/emergency/care/consent/types";

const CONSENT_PATH = "/api/emergency/care/consents";

/** 접수 건의 동의 기록을 조회한다(수령 일시 최신순). */
export async function getConsents(receptionId: string): Promise<ConsentRecord[]> {
  const { data } = await apiClient.get<ApiResponse<ConsentRecord[]>>(CONSENT_PATH, {
    params: { receptionId },
  });
  return data.data;
}

/** 동의 기록을 등록한다(종이 동의서 수령 사실). */
export async function createConsent(request: ConsentRecordCreateRequest): Promise<ConsentRecord> {
  const { data } = await apiClient.post<ApiResponse<ConsentRecord>>(CONSENT_PATH, request);
  return data.data;
}
