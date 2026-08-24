import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/labimaging/types";
import type {
  LabOrderCreateRequest,
  LabOrderCreateResponse,
  LabReceptionDetail,
  LabWorklistItem,
  ReceptionExclusionRequest,
} from "@/features/labimaging/laborder/types";

/**
 * 검사 오더 접수 API 경로 (백엔드 LabOrderController @RequestMapping("/api/lab-imaging/lab-orders"))
 *
 * 하드코딩 전체 URL 은 쓰지 않고(가이드 11.1) 상대 경로 상수로 둔다.
 * "/api/*" 로 시작하므로 next.config rewrite 가 BE(같은 출처)로 프록시한다.
 */
const LAB_ORDER_PATH = "/api/lab-imaging/lab-orders";

/**
 * 검사 오더를 접수한다. (LAB_ORDER + LAB_ORDER_ITEM + LAB_RECEPTION 동시 생성)
 * - 성공: 백엔드 HTTP 201 → data.data 반환
 * - 실패(HTTP 4xx/5xx): 공통 axios interceptor 가 Error(message) 로 reject → saga 에서 처리
 *   (중복 오더는 HTTP 409 + code "LAB004" — 요청서 1.2)
 */
export async function createLabOrder(
  request: LabOrderCreateRequest,
): Promise<LabOrderCreateResponse> {
  const { data } = await apiClient.post<ApiResponse<LabOrderCreateResponse>>(
    LAB_ORDER_PATH,
    request,
  );
  return data.data;
}

/*
 * 접수 목록 조회(fetchLabReceptions)는 삭제했다. (2026-08-14)
 * 워크리스트(fetchLabWorklist)가 같은 목록을 진행 상태까지 얹어서 대체한다.
 * 백엔드 GET /receptions 엔드포인트도 함께 제거됐다.
 */

/**
 * 검사 접수 단건을 접수번호로 조회한다.
 * GET /api/lab-imaging/lab-orders/receptions/{receptionNo} → 200 + LabOrderSummaryDto
 * (없으면 백엔드 409/400 + LAB013 → interceptor 가 Error 로 reject)
 */
export async function fetchLabReceptionByNo(
  receptionNo: string,
): Promise<LabReceptionDetail> {
  const { data } = await apiClient.get<ApiResponse<LabReceptionDetail>>(
    `${LAB_ORDER_PATH}/receptions/${encodeURIComponent(receptionNo)}`,
  );
  return data.data;
}

/**
 * 검사 워크리스트를 조회한다.
 * GET /api/lab-imaging/lab-orders/worklist[?receptionStatusCode=ACCEPTED|EXCLUDED]
 *
 * @param receptionStatusCode "ACCEPTED"=처리 대상, "EXCLUDED"=제외됨.
 *                            생략하면 파라미터를 보내지 않아 백엔드가 전체를 반환한다.
 */
export async function fetchLabWorklist(
  receptionStatusCode?: "ACCEPTED" | "EXCLUDED",
): Promise<LabWorklistItem[]> {
  const { data } = await apiClient.get<ApiResponse<LabWorklistItem[]>>(
    `${LAB_ORDER_PATH}/worklist`,
    { params: receptionStatusCode ? { receptionStatusCode } : undefined },
  );
  return data.data;
}

/**
 * 접수를 워크리스트에서 제외한다. (삭제가 아니라 복구 가능한 상태 변경)
 * POST /api/lab-imaging/lab-orders/receptions/{receptionNo}/exclusion
 */
export async function excludeReception(
  receptionNo: string,
  request: ReceptionExclusionRequest,
): Promise<void> {
  await apiClient.post<ApiResponse<null>>(
    `${LAB_ORDER_PATH}/receptions/${encodeURIComponent(receptionNo)}/exclusion`,
    request,
  );
}

/**
 * 제외된 접수를 워크리스트로 되돌린다.
 * DELETE /api/lab-imaging/lab-orders/receptions/{receptionNo}/exclusion
 *
 * ⚠ 제외 상태가 아닌 접수면 백엔드가 LAB026 으로 거절한다.
 *   (결과 등록으로 목록에서 빠진 건까지 되살아나면 안 되기 때문)
 */
export async function restoreReception(receptionNo: string): Promise<void> {
  await apiClient.delete<ApiResponse<null>>(
    `${LAB_ORDER_PATH}/receptions/${encodeURIComponent(receptionNo)}/exclusion`,
  );
}
