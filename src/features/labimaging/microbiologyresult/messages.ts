/**
 * 미생물검사결과(microbiologyresult) 메시지 코드 사전 (개발표준가이드 15.2)
 *
 * 백엔드 common/LabMessageCode.java 의 LAB069~LAB079 와 코드-문구를 맞춘다.
 * 문구 언어는 12.4 화면 텍스트 언어 원칙에 따라 영문이다.
 */
export const MICROBIOLOGY_RESULT_MESSAGES = {
  LAB017: "Invalid code value.",
  LAB020: "Specimen not found.",
  LAB040: "A confirmed result cannot be modified.",
  LAB041: "This result has already been confirmed.",
  LAB068: "The recorder cannot confirm their own result.",
  LAB069: "Microbiology result has been registered.",
  LAB070: "Microbiology result loaded successfully.",
  LAB071: "Microbiology result not found.",
  LAB072: "Microbiology result has been updated.",
  LAB073: "Microbiology result has been confirmed.",
  LAB074: "This reception must have exactly one microbiology test item.",
  LAB075: "A microbiology result is already registered for this reception.",
  LAB076: "Results can only be registered for specimens assessed as fit.",
  LAB077: "Organism and susceptibility can only be entered for a positive culture.",
  LAB078: "The same antibiotic was entered more than once.",
  LAB110: "Staff member not found, or no longer active.",
  LAB112: "Unable to verify staff information right now.",
  LAB998: "A required field is missing or has an invalid format.",
  LAB999: "An error occurred while processing the request.",
} as const;

export type MicrobiologyResultMessageCode = keyof typeof MICROBIOLOGY_RESULT_MESSAGES;

export function resolveMicrobiologyResultMessage(codeOrMessage: string): string {
  if (codeOrMessage in MICROBIOLOGY_RESULT_MESSAGES) {
    return MICROBIOLOGY_RESULT_MESSAGES[codeOrMessage as MicrobiologyResultMessageCode];
  }
  return codeOrMessage;
}
