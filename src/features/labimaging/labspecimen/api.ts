import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/labimaging/types";
import type {
  LabOrderCreateRequest,
  LabOrderCreateResponse,
} from "@/features/labimaging/labspecimen/types";

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
