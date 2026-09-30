
export const LAB_SCHEDULE_MESSAGES = {
  LAB009: "Lab schedule has been registered.",
  LAB010: "Lab schedule has been rescheduled.",
  LAB013: "Lab reception not found.",
  LAB014: "There is no existing lab schedule to reschedule.",
  LAB027: "A lab schedule already exists. Use Reschedule instead.",
  LAB998: "A required field is missing or has an invalid format.",
  LAB999: "An error occurred while processing the request.",
} as const;

export type LabScheduleMessageCode = keyof typeof LAB_SCHEDULE_MESSAGES;

/**
 * 코드(LAB###)면 문구로 변환하고, 이미 완성 문구면 그대로 반환한다.
 * (백엔드가 완성 문구를 내려주는 경우도 있어 방어적으로 처리 — 요청서 1.1)
 */
export function resolveLabScheduleMessage(codeOrMessage: string): string {
  if (codeOrMessage in LAB_SCHEDULE_MESSAGES) {
    return LAB_SCHEDULE_MESSAGES[codeOrMessage as LabScheduleMessageCode];
  }
  return codeOrMessage;
}
