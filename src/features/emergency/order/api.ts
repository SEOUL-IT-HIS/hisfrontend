import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/emergency/types";
import type {
  MedicationItem,
  Order,
  OrderCancelRequest,
  OrderCreateRequest,
  OrderDispatch,
} from "@/features/emergency/order/types";

const ORDERS_PATH = "/api/emergency/orders";

/** 응급 처방(검사·약품)을 등록한다. 처방코어로 전달되고 응급 DB에는 저장하지 않는다. */
export async function createOrder(request: OrderCreateRequest): Promise<Order> {
  const { data } = await apiClient.post<ApiResponse<Order>>(ORDERS_PATH, request);
  return data.data;
}

/** 접수의 처방 목록을 조회한다(최근 처방 먼저). items 가 없는 가벼운 목록이고 검사/약제 전송 상태 요약이 들어 있다. */
export async function getOrders(receptionId: string): Promise<Order[]> {
  const { data } = await apiClient.get<ApiResponse<Order[]>>(ORDERS_PATH, { params: { encounterId: receptionId } });
  return data.data;
}

/** 처방 한 건을 조회한다(처방ID = 처방코어 prescriptionId). 검사 전송 상태·결과는 items 에 들어 있다. */
export async function getOrder(orderId: string): Promise<Order> {
  const { data } = await apiClient.get<ApiResponse<Order>>(`${ORDERS_PATH}/${orderId}`);
  return data.data;
}

/** 처방을 취소한다. 수정 API 는 없다 — 변경은 취소 후 재등록. */
export async function cancelOrder(orderId: string, request: OrderCancelRequest): Promise<Order> {
  const { data } = await apiClient.patch<ApiResponse<Order>>(`${ORDERS_PATH}/${orderId}/cancel`, request);
  return data.data;
}

/** 약품을 이름으로 검색한다(처방코어 약품 마스터). 이름은 필수 — 비면 서버가 400 을 준다. */
export async function searchMedications(name: string): Promise<MedicationItem[]> {
  const { data } = await apiClient.get<ApiResponse<MedicationItem[]>>(`${ORDERS_PATH}/medications`, { params: { name } });
  return data.data;
}

/** 구두처방을 사후 확정한다(확정 의사 ID). 구두처방이 아니거나 이미 확정된 처방은 오류. */
export async function confirmVerbalOrder(orderId: string, confirmedBy: string): Promise<Order> {
  const { data } = await apiClient.patch<ApiResponse<Order>>(`${ORDERS_PATH}/${orderId}/verbal-confirm`, { confirmedBy });
  return data.data;
}

/** 검사(LAB)로 전송한다(등록 때 즉시 전송을 안 했거나 실패한 경우 다시 시도). */
export async function dispatchLab(orderId: string): Promise<OrderDispatch> {
  const { data } = await apiClient.post<ApiResponse<OrderDispatch>>(`${ORDERS_PATH}/${orderId}/dispatch-lab`);
  return data.data;
}

/** 약제(PHM)로 전송한다. */
export async function dispatchPharmacy(orderId: string): Promise<OrderDispatch> {
  const { data } = await apiClient.post<ApiResponse<OrderDispatch>>(`${ORDERS_PATH}/${orderId}/dispatch-pharmacy`);
  return data.data;
}
