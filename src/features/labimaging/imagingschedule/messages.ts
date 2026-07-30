
export const IMAGE_SCHEDULE_MESSAGES = {
  LAB011: "영상 일정이 등록되었습니다.",
  LAB012: "영상 일정이 재등록되었습니다.",
  LAB015: "영상접수 정보를 찾을 수 없습니다.",
  LAB016: "재등록할 기존 영상 일정이 없습니다.",
  LAB999: "처리 중 오류가 발생했습니다.",
} as const;

export type ImageScheduleMessageCode = keyof typeof IMAGE_SCHEDULE_MESSAGES;

export function resolveImageScheduleMessage(codeOrMessage: string): string {
  if (codeOrMessage in IMAGE_SCHEDULE_MESSAGES) {
    return IMAGE_SCHEDULE_MESSAGES[
      codeOrMessage as ImageScheduleMessageCode
    ];
  }
  return codeOrMessage;
}
