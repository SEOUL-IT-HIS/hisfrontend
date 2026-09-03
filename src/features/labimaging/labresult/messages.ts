/**
 * 검사결과(labresult) 메시지 코드 사전 (개발표준가이드 15.2)
 *
 * 백엔드 common/LabMessageCode.java 의 LAB033~LAB041 과 코드-문구를 맞춘다.
 * 문구 언어는 12.4 화면 텍스트 언어 원칙(2026-08-31 결정)에 따라 영문이다.
 */
export const LAB_RESULT_MESSAGES = {
  LAB017: "Invalid code value.",
  LAB033: "Test result has been registered.",
  LAB034: "Test result loaded successfully.",
  LAB035: "Test item not found.",
  LAB036: "A result is already registered for this test item.",
  LAB037: "Test result not found.",
  LAB038: "Test result has been updated.",
  LAB039: "Test result has been confirmed.",
  LAB040: "A confirmed result cannot be modified.",
  LAB041: "This result has already been confirmed.",
  LAB998: "A required field is missing or has an invalid format.",
  LAB999: "An error occurred while processing the request.",
} as const;

export type LabResultMessageCode = keyof typeof LAB_RESULT_MESSAGES;

/**
 * 코드(LAB###)면 문구로 변환하고, 이미 완성 문구면 그대로 반환한다.
 * (백엔드가 완성 문구를 내려주는 경우도 있어 방어적으로 처리)
 */
export function resolveLabResultMessage(codeOrMessage: string): string {
  if (codeOrMessage in LAB_RESULT_MESSAGES) {
    return LAB_RESULT_MESSAGES[codeOrMessage as LabResultMessageCode];
  }
  return codeOrMessage;
}
