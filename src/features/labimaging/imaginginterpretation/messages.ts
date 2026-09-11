/**
 * 영상판독(imaginginterpretation) 메시지 코드 사전 (개발표준가이드 15.2)
 *
 * 백엔드 common/LabMessageCode.java 의 LAB057~LAB065 와 코드-문구를 맞춘다.
 * 문구 언어는 12.4 화면 텍스트 언어 원칙(2026-08-31 결정)에 따라 영문이다.
 */
export const IMAGE_READING_MESSAGES = {
  LAB017: "Invalid code value.",
  LAB057: "Reading has been assigned.",
  LAB058: "Reading worklist loaded successfully.",
  LAB059: "Reading findings have been saved.",
  LAB060: "Reading has been confirmed.",
  LAB061: "Reading not found.",
  LAB062: "This reading has already been confirmed.",
  LAB063: "Findings are required to confirm a reading.",
  LAB064: "Imaging item not found.",
  LAB065: "Reading loaded successfully.",
  LAB998: "A required field is missing or has an invalid format.",
  LAB999: "An error occurred while processing the request.",
} as const;

export type ImageReadingMessageCode = keyof typeof IMAGE_READING_MESSAGES;

/**
 * 코드(LAB###)면 문구로 변환하고, 이미 완성 문구면 그대로 반환한다.
 * (백엔드가 완성 문구를 내려주는 경우도 있어 방어적으로 처리)
 */
export function resolveImageReadingMessage(codeOrMessage: string): string {
  if (codeOrMessage in IMAGE_READING_MESSAGES) {
    return IMAGE_READING_MESSAGES[codeOrMessage as ImageReadingMessageCode];
  }
  return codeOrMessage;
}
