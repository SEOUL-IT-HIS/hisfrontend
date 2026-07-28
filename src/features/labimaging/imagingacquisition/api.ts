import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/labimaging/types";
import type {
  ImageOrderCreateRequest,
  ImageOrderCreateResponse,
} from "@/features/labimaging/imagingacquisition/types";

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
