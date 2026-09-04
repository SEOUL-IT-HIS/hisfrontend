/**
 * 검체(labspecimen) 메시지 코드 사전 (개발표준가이드 15.2)
 *
 * 백엔드 common/LabMessageCode.java 와 코드-문구를 맞춘다.
 */
export const LAB_SPECIMEN_MESSAGES = {
  LAB013: "Lab reception not found.",
  LAB017: "Invalid code value.",
  LAB018: "Specimen has been registered.",
  LAB019: "Specimen loaded successfully.",
  LAB020: "Specimen not found.",
  LAB021: "Specimen acceptance and fitness assessment have been registered.",
  LAB022: "This specimen has already been accepted and assessed.",
  LAB998: "A required field is missing or has an invalid format.",
  LAB999: "An error occurred while processing the request.",
} as const;

export type LabSpecimenMessageCode = keyof typeof LAB_SPECIMEN_MESSAGES;

/**
 * 코드(LAB###)면 문구로 변환하고, 이미 완성 문구면 그대로 반환한다.
 * (백엔드가 완성 문구를 내려주는 경우도 있어 방어적으로 처리)
 */
export function resolveLabSpecimenMessage(codeOrMessage: string): string {
  if (codeOrMessage in LAB_SPECIMEN_MESSAGES) {
    return LAB_SPECIMEN_MESSAGES[codeOrMessage as LabSpecimenMessageCode];
  }
  return codeOrMessage;
}
