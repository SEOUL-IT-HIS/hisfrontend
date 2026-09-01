/**
 * imageOrder(영상) 메시지 코드 사전 (개발표준가이드 15.2)
 *
 * 백엔드 common/LabMessageCode.java 의 LAB005~LAB008 + LAB999 와 코드-문구를 맞춘다.
 * 백엔드 응답 message 가 코드(LAB###)로 내려오면 이 사전으로 문구 변환 후 노출한다. (요청서 1.1)
 */
export const IMAGE_ORDER_MESSAGES = {
  LAB005: "Imaging reception has been created.",
  LAB006: "No imaging orders found.",
  LAB007: "This order has already been received.",
  LAB017: "Invalid code value.",
  LAB998: "A required field is missing or has an invalid format.",
  LAB999: "An error occurred while processing the request.",
} as const;

export type ImageOrderMessageCode = keyof typeof IMAGE_ORDER_MESSAGES;

/**
 * 코드(LAB###)면 문구로 변환하고, 이미 완성 문구면 그대로 반환한다. (요청서 1.1)
 */
export function resolveImageOrderMessage(codeOrMessage: string): string {
  if (codeOrMessage in IMAGE_ORDER_MESSAGES) {
    return IMAGE_ORDER_MESSAGES[
      codeOrMessage as ImageOrderMessageCode
    ];
  }
  return codeOrMessage;
}
