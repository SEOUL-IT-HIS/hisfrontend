import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/emergency/types";
import type { CprCreateRequest, CprEvent } from "@/features/emergency/care/cpr/types";

const CPR_PATH = "/api/emergency/care/cpr-timelines";

/** 접수 건의 CPR 기록을 조회한다(최신 시작 순, 타임라인은 이벤트 시각 순). */
export async function getCprEvents(receptionId: string): Promise<CprEvent[]> {
  const { data } = await apiClient.get<ApiResponse<CprEvent[]>>(CPR_PATH, { params: { receptionId } });
  return data.data;
}

/** CPR 기록(세션 1건 + 이벤트 목록)을 등록한다. */
export async function createCprEvent(request: CprCreateRequest): Promise<CprEvent> {
  const { data } = await apiClient.post<ApiResponse<CprEvent>>(CPR_PATH, request);
  return data.data;
}
