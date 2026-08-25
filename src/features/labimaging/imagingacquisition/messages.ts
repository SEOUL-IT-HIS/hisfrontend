/**
 * 동의(imagingacquisition) 메시지 코드 사전 (개발표준가이드 15.2)
 *
 * 백엔드 common/LabMessageCode.java 와 코드-문구를 맞춘다.
 */
export const CONSENT_MESSAGES = {
  LAB017: "유효하지 않은 코드값입니다.",
  LAB028: "동의 정보가 등록되었습니다.",
  LAB029: "동의 정보 조회에 성공했습니다.",
  LAB030: "영상 오더 정보를 찾을 수 없습니다.",
  LAB031: "이미 등록된 동의가 있습니다.",
  LAB998: "필수 항목이 누락되었거나 형식이 올바르지 않습니다.",
  LAB999: "처리 중 오류가 발생했습니다.",
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
