
export const LAB_SCHEDULE_MESSAGES = {
  LAB009: "검사 일정이 등록되었습니다.",
  LAB010: "검사 일정이 재등록되었습니다.",
  LAB013: "검사접수 정보를 찾을 수 없습니다.",
  LAB014: "재등록할 기존 검사 일정이 없습니다.",
  LAB999: "처리 중 오류가 발생했습니다.",
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
