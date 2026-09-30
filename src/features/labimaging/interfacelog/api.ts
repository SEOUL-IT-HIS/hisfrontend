import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/labimaging/types";
import type {
  InterfaceSendLog,
  InterfaceSendLogSearch,
  PageResponse,
} from "@/features/labimaging/interfacelog/types";

/**
 * 연계 발신 이력 API — ZP2-120 / ZP2-124 (5차 Phase 6)
 * 백엔드 InterfaceSendLogController 와 1:1.
 */
const SEND_LOG_PATH = "/api/lab-imaging/interface-send-logs";

/** GET /interface-send-logs — 빈 조건은 보내지 않는다(서버에서 "전체"로 본다) */
export async function fetchInterfaceSendLogs(
  search: InterfaceSendLogSearch,
): Promise<PageResponse<InterfaceSendLog>> {
  const params: Record<string, string | number> = { page: search.page, size: search.size };
  if (search.eventTypeCode) params.eventTypeCode = search.eventTypeCode;
  if (search.sendStatusCode) params.sendStatusCode = search.sendStatusCode;
  if (search.from) params.from = search.from;
  if (search.to) params.to = search.to;

  const { data } = await apiClient.get<ApiResponse<PageResponse<InterfaceSendLog>>>(SEND_LOG_PATH, { params });
  return data.data;
}

/** GET /interface-send-logs/{id} — 원문(payload) 포함 */
export async function fetchInterfaceSendLogDetail(interfaceSendLogId: string): Promise<InterfaceSendLog> {
  const { data } = await apiClient.get<ApiResponse<InterfaceSendLog>>(
    `${SEND_LOG_PATH}/${encodeURIComponent(interfaceSendLogId)}`,
  );
  return data.data;
}

/**
 * POST /interface-send-logs/{id}/resend — 같은 event_id·같은 원문으로 다시 발행한다.
 * ⚠ 응답은 "요청 접수" 시점의 상태다. 실제 성공/실패는 Kafka 콜백이 나중에 기록하므로 목록을 다시 조회해 확인한다.
 */
export async function resendInterfaceSendLog(interfaceSendLogId: string): Promise<InterfaceSendLog> {
  const { data } = await apiClient.post<ApiResponse<InterfaceSendLog>>(
    `${SEND_LOG_PATH}/${encodeURIComponent(interfaceSendLogId)}/resend`,
  );
  return data.data;
}
