import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/labimaging/types";
import type {
  ImageOrderCreateRequest,
  ImageOrderCreateResponse,
  ImageReceptionDetail,
  ImageReceptionExclusionRequest,
  ImageReceptionSummary,
  ImageWorklistItem,
} from "@/features/labimaging/imagingorder/types";

/**
 * 영상 오더 접수 API 경로 (백엔드 ImageOrderController @RequestMapping("/api/lab-imaging/image-orders"))
 *
 * "/api/*" 로 시작하므로 next.config rewrite 가 BE(같은 출처)로 프록시한다.
 */
const IMAGE_ORDER_PATH = "/api/lab-imaging/image-orders";

/**
 * 영상 오더를 접수한다. (IMAGE_ORDER + IMAGE_ORDER_ITEM + IMAGE_RECEPTION 동시 생성)
 * - 실패(HTTP 4xx/5xx)는 공통 axios interceptor 가 reject → saga 에서 처리.
 *   (중복 오더는 HTTP 409 + code "LAB008" — 요청서 1.2)
 */
export async function createImageOrder(
  request: ImageOrderCreateRequest,
): Promise<ImageOrderCreateResponse> {
  const { data } = await apiClient.post<ApiResponse<ImageOrderCreateResponse>>(
    IMAGE_ORDER_PATH,
    request,
  );
  return data.data;
}

/**
 * 영상 접수 목록을 조회한다.
 * GET /api/lab-imaging/image-orders/receptions[?scheduledYn=Y|N] → 200 + ImageOrderSummaryDto[]
 *
 * @param scheduledYn "N"=일정 미등록(일정등록 대상), "Y"=일정 등록됨(재조정 대상).
 *                    생략하면 파라미터를 보내지 않아 백엔드가 전체를 반환한다.
 */
export async function fetchImageReceptions(
  scheduledYn?: "Y" | "N",
): Promise<ImageReceptionSummary[]> {
  const { data } = await apiClient.get<ApiResponse<ImageReceptionSummary[]>>(
    `${IMAGE_ORDER_PATH}/receptions`,
    { params: scheduledYn ? { scheduledYn } : undefined },
  );
  return data.data;
}

/**
 * 영상 워크리스트를 조회한다. (진행 상태 포함)
 * GET /api/lab-imaging/image-orders/worklist[?receptionStatusCode=ACCEPTED|EXCLUDED]
 *
 * ⚠ 위 fetchImageReceptions 와 목적이 달라 둘 다 남는다.
 *   그쪽은 "일정 등록 대상 고르기"용이라 일정 여부로 거르고 최신순이고,
 *   이쪽은 "오늘 처리할 접수 전부"라 제외 여부로 거르고 오래된 건이 위로 온다.
 *
 * @param receptionStatusCode "ACCEPTED"=처리 대상, "EXCLUDED"=제외됨.
 *                            생략하면 파라미터를 보내지 않아 백엔드가 전체를 반환한다.
 */
export async function fetchImageWorklist(
  receptionStatusCode?: "ACCEPTED" | "EXCLUDED",
): Promise<ImageWorklistItem[]> {
  const { data } = await apiClient.get<ApiResponse<ImageWorklistItem[]>>(
    `${IMAGE_ORDER_PATH}/worklist`,
    { params: receptionStatusCode ? { receptionStatusCode } : undefined },
  );
  return data.data;
}

/**
 * 접수를 워크리스트에서 제외한다. (삭제가 아니라 복구 가능한 상태 변경)
 * POST /api/lab-imaging/image-orders/receptions/{receptionNo}/exclusion
 */
export async function excludeImageReception(
  receptionNo: string,
  request: ImageReceptionExclusionRequest,
): Promise<void> {
  await apiClient.post(
    `${IMAGE_ORDER_PATH}/receptions/${encodeURIComponent(receptionNo)}/exclusion`,
    request,
  );
}

/**
 * 제외된 접수를 워크리스트로 되돌린다.
 * POST /api/lab-imaging/image-orders/receptions/{receptionNo}/restoration
 *
 * ⚠ 제외 상태가 아닌 접수를 복구하려 하면 400 + LAB045 로 거절된다.
 */
export async function restoreImageReception(receptionNo: string): Promise<void> {
  await apiClient.post(
    `${IMAGE_ORDER_PATH}/receptions/${encodeURIComponent(receptionNo)}/restoration`,
  );
}

/**
 * 영상 접수 단건을 접수번호로 조회한다.
 * GET /api/lab-imaging/image-orders/receptions/{receptionNo} → 200 + ImageOrderSummaryDto
 */
export async function fetchImageReceptionByNo(
  receptionNo: string,
): Promise<ImageReceptionDetail> {
  const { data } = await apiClient.get<ApiResponse<ImageReceptionDetail>>(
    `${IMAGE_ORDER_PATH}/receptions/${encodeURIComponent(receptionNo)}`,
  );
  return data.data;
}
