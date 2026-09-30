/**
 * labOrder(검사) 메시지 코드 사전 (개발표준가이드 15.2)
 *
 * 백엔드 common/LabMessageCode.java 의 LAB001~LAB004 + LAB999 와 코드-문구를 맞춘다.
 * 백엔드 응답 message 가 코드(LAB###)로 내려오면 이 사전으로 문구 변환 후 노출한다. (요청서 1.1)
 */
export const LAB_ORDER_MESSAGES = {
  LAB001: "Lab reception has been created.",
  LAB002: "No lab orders found.",
  LAB003: "Reception loaded successfully.",
  LAB004: "This order has already been received.",
  LAB013: "Lab reception not found.",
  LAB023: "Worklist loaded successfully.",
  LAB024: "Reception has been excluded from the worklist.",
  LAB025: "Reception has been restored to the worklist.",
  LAB026: "This reception is not excluded, so it cannot be restored.",
  LAB017: "Invalid code value.",
  LAB998: "A required field is missing or has an invalid format.",
  LAB999: "An error occurred while processing the request.",
} as const;

export type LabOrderMessageCode = keyof typeof LAB_ORDER_MESSAGES;

/**
 * 코드(LAB###)면 문구로 변환하고, 이미 완성 문구면 그대로 반환한다.
 * (백엔드가 완성 문구를 내려주는 경우도 있어 방어적으로 처리 — 요청서 1.1)
 */
export function resolveLabOrderMessage(codeOrMessage: string): string {
  if (codeOrMessage in LAB_ORDER_MESSAGES) {
    return LAB_ORDER_MESSAGES[codeOrMessage as LabOrderMessageCode];
  }
  return codeOrMessage;
}
