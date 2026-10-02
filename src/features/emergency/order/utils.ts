import { ORDER_ITEM_TYPE, type Order, type OrderItemType } from "@/features/emergency/order/types";

/** 취소된 처방인지 — 취소 시각이 있거나 처방코어 상태가 CANCEL 또는 DEACTIV 로 시작한다. */
export function isOrderCancelled(order: Order): boolean {
  return !!order.cancelledAt || /^(CANCEL|DEACTIV)/i.test(order.status ?? "");
}

/** 등록 직후 전송 결과(SENT/FAILED)를 처방코어의 전송 상태 값으로 맞춘다. 해당 항목 없음 등은 null. */
function fromDispatchResult(result: string | null | undefined): string | null {
  return result === "SENT" || result === "FAILED" ? result : null;
}

/** 검사 전송 상태 — 처방코어가 알려준 값을 먼저, 없으면 이 화면에서 등록·전송한 결과. null 이면 모름/해당 없음 */
export function labSendState(order: Order): string | null {
  return order.labSendStatus ?? fromDispatchResult(order.labDispatchStatus);
}

/** 약제 전송 상태 — 위와 같다. */
export function pharmacySendState(order: Order): string | null {
  return order.pharmacySendStatus ?? fromDispatchResult(order.pharmacyDispatchStatus);
}

/** 항목이 불러와져 있는지(목록은 가벼워서 items 가 비어 있다) */
export function hasLoadedItems(order: Order): boolean {
  return !!order.items && order.items.length > 0;
}

/** 해당 종류의 항목이 있는지. 항목을 아직 모르면 null */
export function includesItemType(order: Order, type: OrderItemType): boolean | null {
  if (!hasLoadedItems(order)) return null;
  return order.items!.some((item) => item.prescriptionType === type);
}

/** 검사 항목이 있을 수 있는 처방인지(목록만 있을 때는 검사 전송 상태가 있으면 있다고 본다) */
export function mayHaveLab(order: Order): boolean {
  return includesItemType(order, ORDER_ITEM_TYPE.LAB) ?? order.labSendStatus != null;
}

/**
 * 약품 항목이 있는 처방인지. 처방코어 목록의 pharmacySendStatus 는 약품이 없는 검사 처방에도 PENDING 으로 내려오므로
 * (검사 쪽 labSendStatus 는 검사 항목이 없으면 null) 그 값으로는 약품 유무를 알 수 없다 — 항목을 불러온 뒤에만 true 가 된다.
 */
export function mayHaveDrug(order: Order): boolean {
  return includesItemType(order, ORDER_ITEM_TYPE.DRUG) === true;
}

/** 화면에 보여줄 약제 전송 상태 — 약품 항목이 있을 때만(약품이 없는데 PENDING 이 보이는 것을 막는다). 이미 SENT/FAILED 면 항상 보인다. */
export function visiblePharmacyState(order: Order): string | null {
  const state = pharmacySendState(order);
  if (state === "SENT" || state === "FAILED") return state;
  return mayHaveDrug(order) ? state : null;
}

/** 처방ID 앞 8자 — 선택 목록에서 처방을 구분하는 용도 */
export function shortOrderId(orderId: string): string {
  return orderId.slice(0, 8);
}
