import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/labimaging/types";
import type {
  ImageOrderCreateRequest,
  ImageOrderCreateResponse,
  ImageReceptionDetail,
  ImageReceptionSummary,
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
