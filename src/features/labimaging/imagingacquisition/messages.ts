/**
 * 동의(imagingacquisition) 메시지 코드 사전 (개발표준가이드 15.2)
 *
 * 백엔드 common/LabMessageCode.java 와 코드-문구를 맞춘다.
 */
export const CONSENT_MESSAGES = {
  LAB017: "Invalid code value.",
  LAB028: "Consent has been registered.",
  LAB029: "Consent loaded successfully.",
  LAB030: "Imaging order not found.",
  LAB031: "Consent has already been registered.",
  LAB998: "A required field is missing or has an invalid format.",
  LAB999: "An error occurred while processing the request.",
} as const;

export type ConsentMessageCode = keyof typeof CONSENT_MESSAGES;

/**
 * 코드(LAB###)면 문구로 변환하고, 이미 완성 문구면 그대로 반환한다.
 * (백엔드가 완성 문구를 내려주는 경우도 있어 방어적으로 처리)
 */
export function resolveConsentMessage(codeOrMessage: string): string {
  if (codeOrMessage in CONSENT_MESSAGES) {
    return CONSENT_MESSAGES[codeOrMessage as ConsentMessageCode];
  }
  return codeOrMessage;
}
