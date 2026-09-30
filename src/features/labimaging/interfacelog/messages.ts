/**
 * 연계 발신 이력(interfacelog) 메시지 코드 사전 (개발표준가이드 15.2)
 *
 * 백엔드 common/LabMessageCode.java 의 LAB088~LAB092 와 코드-문구를 맞춘다.
 * 문구 언어는 12.4 화면 텍스트 언어 원칙에 따라 영문이다.
 */
export const INTERFACE_SEND_LOG_MESSAGES = {
  LAB088: "Send history loaded successfully.",
  LAB089: "Send history not found.",
  LAB090: "Resend has been requested.",
  LAB091: "Kafka is disabled, so the message cannot be resent.",
  LAB092: "This entry cannot be resent. (already sent / no payload to publish)",
  LAB998: "A required field is missing or has an invalid format.",
  LAB999: "An error occurred while processing the request.",
} as const;

export type InterfaceSendLogMessageCode = keyof typeof INTERFACE_SEND_LOG_MESSAGES;

export function resolveInterfaceSendLogMessage(codeOrMessage: string): string {
  if (codeOrMessage in INTERFACE_SEND_LOG_MESSAGES) {
    return INTERFACE_SEND_LOG_MESSAGES[codeOrMessage as InterfaceSendLogMessageCode];
  }
  return codeOrMessage;
}
