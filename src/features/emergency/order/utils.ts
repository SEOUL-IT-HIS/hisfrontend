import {
  ORDER_ITEM_TYPE,
  PHARMACY_DISPATCH_ENABLED,
  type Order,
  type OrderItem,
  type OrderItemType,
} from "@/features/emergency/order/types";

/** 취소된 처방인지 — 취소 시각이 있거나 처방코어 상태가 CANCEL 또는 DEACTIV 로 시작한다. */
export function isOrderCancelled(order: Order): boolean {
  return !!order.cancelledAt || /^(CANCEL|DEACTIV)/i.test(order.status ?? "");
}

/** 등록 직후 전송 결과(SENT/FAILED)를 처방코어의 전송 상태 값으로 맞춘다. 해당 항목 없음 등은 null. */
function fromDispatchResult(result: string | null | undefined): string | null {
  return result === "SENT" || result === "FAILED" ? result : null;
}

/**
 * LAB 이 이 검사 항목을 이미 받았는지: 전송 완료(SENT)이거나 LAB 오더번호가 있거나, 거절 사유가 "이미 접수된 오더"다.
 * 같은 처방을 다시 전송하면 LAB 이 "이미 접수된 오더입니다"로 거절하면서 처방코어가 항목을 FAILED 로 덮어쓰는데
 * (실서버에서 확인), 그때도 LAB 은 처음 전송을 받아 둔 상태라 실패로 보지 않는다.
 */
export function labItemReceived(item: OrderItem): boolean {
  return item.sendStatus === "SENT" || !!item.labOrderId || /이미 접수/.test(item.rejectReason ?? "");
}

/** 처방의 검사 항목 */
function labItemsOf(order: Order): OrderItem[] {
  return (order.items ?? []).filter((item) => item.prescriptionType === ORDER_ITEM_TYPE.LAB);
}

/** LAB 이 실제로 거절한 항목(중복 전송으로 인한 "이미 접수"는 제외) — 거절 사유를 화면에 보여주는 용도 */
export function labRejectedItems(order: Order): OrderItem[] {
  return labItemsOf(order).filter((item) => item.sendStatus === "FAILED" && !labItemReceived(item));
}

/**
 * 검사 전송 상태. 항목의 전송 상태를 불러와 있으면 그것으로 계산하고(목록 요약보다 최신이다),
 * 아니면 처방코어 목록의 요약, 그것도 없으면 이 화면에서 등록·전송한 결과를 쓴다. null 이면 모름/해당 없음.
 * 계산: 실제로 거절된 항목이 있으면 FAILED, 전부 LAB 이 받았으면 SENT, 그 밖에는 PENDING.
 */
export function labSendState(order: Order): string | null {
  const labItems = labItemsOf(order);
  if (labItems.some((item) => item.sendStatus != null || !!item.labOrderId)) {
    if (labItems.some((item) => item.sendStatus === "FAILED" && !labItemReceived(item))) return "FAILED";
    return labItems.every(labItemReceived) ? "SENT" : "PENDING";
  }
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
  if (!PHARMACY_DISPATCH_ENABLED) return null;
  const state = pharmacySendState(order);
  if (state === "SENT" || state === "FAILED") return state;
  return mayHaveDrug(order) ? state : null;
}

/** 결과가 도착한 검사 항목인지(결과 시각이 있거나 결과 줄에 값이 있다) */
export function labItemHasResult(item: OrderItem): boolean {
  return !!item.resultReportedAt || (item.resultDetails ?? []).some((d) => d.resultValue != null && d.resultValue !== "");
}

/**
 * 응급이 결과를 받지 않는 검사 코드 — 05 Blood Culture, 06 Urine Culture, 07 Histopathology, 08 Cytology.
 * LAB 문서 기준으로 받는 결과항목이 없고(배양·병리), 처방코어도 이 결과는 반영하지 않는다(전체 MSA 카탈로그 점검 I-04).
 * 01 Blood Glucose, 02 CBC, 03 Liver Function, 04 Urinalysis 만 결과를 받는다. 수술·영상은 이번 범위에서 제외했다.
 */
export const LAB_NO_RESULT_ITEM_CODES: readonly string[] = ["05", "06", "07", "08"];

/** 약품 마스터의 제형 이름(정제, 주사제 …)을 admin 공통코드 DOSAGE_FORM_CD(01 정제·캡슐, 02 수액, 03 주사)로 바꾼다. 모르면 "" */
export function dosageFormFromName(formName: string | null | undefined): string {
  if (!formName) return "";
  if (formName.includes("수액")) return "02";
  if (formName.includes("주사")) return "03";
  if (/정|캡슐|산|과립|시럽/.test(formName)) return "01";
  return "";
}

/** admin 공통코드 TEST_TYPE_CD 를 못 받을 때의 폴백 */
export const LAB_TEST_FALLBACK_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "01", label: "Blood Glucose Test" },
  { value: "02", label: "CBC" },
  { value: "03", label: "Liver Function Test" },
  { value: "04", label: "Urinalysis" },
  { value: "05", label: "Blood Culture" },
  { value: "06", label: "Urine Culture" },
  { value: "07", label: "Histopathology" },
  { value: "08", label: "Cytology" },
];

/** 이 검사 항목은 응급에서 결과를 받는 검사인지 */
export function labResultExpected(item: OrderItem): boolean {
  return item.prescriptionType === ORDER_ITEM_TYPE.LAB && !LAB_NO_RESULT_ITEM_CODES.includes(item.itemCode);
}

/** LAB 이 받았지만 결과가 아직 안 온 검사가 있는 처방 — 결과가 올 때까지 가끔 다시 불러올 대상(결과를 받지 않는 검사는 제외) */
export function awaitingLabResult(order: Order): boolean {
  if (isOrderCancelled(order)) return false;
  return labItemsOf(order).some((item) => labResultExpected(item) && labItemReceived(item) && !labItemHasResult(item));
}

/** 이상 플래그 → 화면 문구와 색: L 낮음, H 높음, N/없음 정상 */
export function abnormalFlagLabel(flag: string | null | undefined): { text: string; tone: "low" | "high" | "normal" | "other" } {
  const value = (flag ?? "").trim().toUpperCase();
  if (value === "L" || value === "LOW") return { text: "Low", tone: "low" };
  if (value === "H" || value === "HIGH") return { text: "High", tone: "high" };
  if (value === "" || value === "N" || value === "NORMAL") return { text: "Normal", tone: "normal" };
  return { text: value, tone: "other" };
}

/** 처방ID 앞 8자 — 선택 목록에서 처방을 구분하는 용도 */
export function shortOrderId(orderId: string): string {
  return orderId.slice(0, 8);
}

/** 처방을 화면에서 알아보게 하는 이름 — 처방 ID 대신 항목 이름(예: "Blood Glucose Test, 타이레놀정500mg"). 아직 항목을 모르면 빈 글자 */
export function orderTitle(orders: Order[], orderId: string): string {
  const order = orders.find((o) => o.orderId === orderId);
  return (order?.items ?? []).map((item) => item.itemName).join(", ");
}
