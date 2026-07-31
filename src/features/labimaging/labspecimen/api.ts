import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/labimaging/types";
import type {
  LabOrderCreateRequest,
  LabOrderCreateResponse,
} from "@/features/labimaging/labspecimen/types";

/**
 * 검사 오더 접수 API 경로 (백엔드 LabOrderController @PostMapping("/lab-orders"))
 *
 * 하드코딩 전체 URL 은 쓰지 않고(가이드 11.1) 상대 경로 상수로 둔다.
 * baseURL / 프록시 라우팅은 공통 axios instance(lib/axios.ts)와 리더 관리 영역에서 처리한다.
 * NOTE(리더 확인 필요): 현재 next.config rewrite 는 "/api/*" 만 프록시하는데
 *   본 엔드포인트는 "/lab-orders" 라 라우팅 경로 설정이 별도로 필요하다. (산출물 리더 요청 목록 참고)
 */
const LAB_ORDER_PATH = "/lab-orders";

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
