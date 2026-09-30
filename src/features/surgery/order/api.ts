/**
 * 수술 오더 API (SL2-36 / SL2-44 / SL2-225 / SL2-226 / SL2-15)
 *
 * <p>백엔드 SurgeryOrderController(@RequestMapping("/api/surgery/orders")) 와 1:1 대응.</p>
 *
 * <p><b>예전 경로에서 옮겨왔다</b> — 수술 요청은 {@code POST /api/surgery/schedule}
 * 로 들어왔었다. 그런데 그 시점에는 수술실도 확정 시각도 없어 '일정'이라 부를 것이 없었고,
 * 같은 대상을 읽을 때는 {@code /requests} 라 부르면서 쓸 때만 {@code /schedule} 이라
 * 부르는 모순이 있었다. 이제 요청은 요청대로 부른다.</p>
 */
import apiClient from "@/lib/axios";
import type { ApiResponse, PageResponse } from "@/features/surgery/types";
import type {
  AssignSurgeryOrderRequest,
  CreateSurgeryOrderRequest,
  RejectSurgeryOrderRequest,
  SurgeryOrder,
  SurgeryOrderSearchParams,
} from "@/features/surgery/order/types";

const ORDER_PATH = "/api/surgery/orders";

/**
 * 오더 목록을 조회한다. (SL2-225)
 *
 * <p>배정 대기만 보려면 {@code orderStatusCd: "00"} 을 준다. 조건을 안 주면 반려된 것도 나온다.
 * 기본 정렬은 응급 우선이라 화면에서 다시 정렬하지 않는다.</p>
 *
 * <p>백엔드가 PageResponse 를 돌려주지만 호출부는 배열만 필요하므로 items 를 꺼내 준다.
 * 총 건수가 화면에 필요해지면 그때 PageResponse 를 그대로 주는 함수를 따로 둔다.</p>
 */
export async function getSurgeryOrders(
  params?: SurgeryOrderSearchParams,
): Promise<SurgeryOrder[]> {
  const { data } = await apiClient.get<ApiResponse<PageResponse<SurgeryOrder>>>(
    ORDER_PATH,
    { params },
  );
  return data.data?.items ?? [];
}

/** 오더 단건을 조회한다. 없으면 404 SUR057. */
export async function getSurgeryOrder(orderId: string): Promise<SurgeryOrder> {
  const { data } = await apiClient.get<ApiResponse<SurgeryOrder>>(
    `${ORDER_PATH}/${orderId}`,
  );
  return data.data;
}

/** 진료 수술 요청을 접수한다. (SL2-36) */
export async function createSurgeryOrder(
  request: CreateSurgeryOrderRequest,
): Promise<SurgeryOrder> {
  const { data } = await apiClient.post<ApiResponse<SurgeryOrder>>(
    ORDER_PATH,
    request,
  );
  return data.data;
}

/**
 * 응급 수술 요청을 접수한다. (SL2-44)
 *
 * <p>본문은 일반 요청과 같다 — <b>경로만 다르다</b>. 응급 여부를 본문으로 보내면
 * 일반 요청이 'Y' 를 실어 배정 우선순위를 가로챌 수 있어 백엔드가 경로로 판단한다.</p>
 */
export async function createEmergencySurgeryOrder(
  request: CreateSurgeryOrderRequest,
): Promise<SurgeryOrder> {
  const { data } = await apiClient.post<ApiResponse<SurgeryOrder>>(
    `${ORDER_PATH}/emergency`,
    request,
  );
  return data.data;
}

/**
 * 수술실을 배정한다 → 오더가 수락된다. (SL2-15)
 *
 * <p>주소가 {@code /accept} 가 아니라 {@code /assign} 인 이유 — 담당자가 하는 일은
 * 수술실을 정하는 것이고 수락은 그 결과다. 응답의 {@code surgeryId} 로 만들어진 수술을 알 수 있다.</p>
 */
export async function assignSurgeryOrder(
  orderId: string,
  request: AssignSurgeryOrderRequest,
): Promise<SurgeryOrder> {
  const { data } = await apiClient.patch<ApiResponse<SurgeryOrder>>(
    `${ORDER_PATH}/${orderId}/assign`,
    request,
  );
  return data.data;
}

/**
 * 오더를 반려한다. (SL2-226)
 *
 * <p>수술은 만들어지지 않는다. 본문 없이 불러도 된다 — 사유 코드 그룹이 admin 에
 * 아직 없어 사유 없는 반려가 불가피하다.</p>
 */
export async function rejectSurgeryOrder(
  orderId: string,
  request: RejectSurgeryOrderRequest,
): Promise<SurgeryOrder> {
  const { data } = await apiClient.patch<ApiResponse<SurgeryOrder>>(
    `${ORDER_PATH}/${orderId}/reject`,
    request,
  );
  return data.data;
}
