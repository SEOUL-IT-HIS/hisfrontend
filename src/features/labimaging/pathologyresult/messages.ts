/**
 * 병리검사결과(pathologyresult) 메시지 코드 사전 (개발표준가이드 15.2)
 * 백엔드 common/LabMessageCode.java 의 LAB080~LAB087 과 코드-문구를 맞춘다. (영문, 가이드 12.4)
 */
export const PATHOLOGY_RESULT_MESSAGES = {
  LAB017: "Invalid code value.",
  LAB035: "Test item not found.",
  LAB040: "A confirmed result cannot be modified.",
  LAB041: "This result has already been confirmed.",
  LAB055: "Could not connect to the file storage. Please try again later.",
  LAB056: "Saving failed, so the attachment upload was cancelled.",
  LAB068: "The recorder cannot confirm their own result.",
  LAB079: "This test item is not a pathology item.",
  LAB080: "Pathology result has been registered.",
  LAB081: "Pathology result loaded successfully.",
  LAB082: "Pathology result not found.",
  LAB083: "Pathology result has been updated.",
  LAB084: "Pathology result has been confirmed.",
  LAB085: "A pathology result is already registered for this test item.",
  LAB086: "There is no attachment.",
  LAB087: "Attachment type not allowed. Use JPG, PNG, or PDF.",
  LAB998: "A required field is missing or has an invalid format.",
  LAB999: "An error occurred while processing the request.",
} as const;

export type PathologyResultMessageCode = keyof typeof PATHOLOGY_RESULT_MESSAGES;

export function resolvePathologyResultMessage(codeOrMessage: string): string {
  if (codeOrMessage in PATHOLOGY_RESULT_MESSAGES) {
    return PATHOLOGY_RESULT_MESSAGES[codeOrMessage as PathologyResultMessageCode];
  }
  return codeOrMessage;
}
