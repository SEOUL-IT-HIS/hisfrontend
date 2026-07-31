import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/labimaging/types";
import type {
  ImageOrderCreateRequest,
  ImageOrderCreateResponse,
} from "@/features/labimaging/imagingacquisition/types";

/**
 * 영상 오더 접수 API 경로 (백엔드 ImageOrderController @PostMapping("/image-orders"))
 *
 * NOTE(리더 확인 필요): next.config rewrite 가 "/api/*" 만 프록시하므로
 *   "/image-orders" 경로 라우팅 설정이 별도로 필요하다. (산출물 리더 요청 목록 참고)
 */
const IMAGE_ORDER_PATH = "/image-orders";

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
