
export const IMAGE_SCHEDULE_MESSAGES = {
  LAB011: "Imaging schedule has been registered.",
  LAB012: "Imaging schedule has been rescheduled.",
  LAB015: "Imaging reception not found.",
  LAB016: "There is no existing imaging schedule to reschedule.",
  LAB017: "Invalid code value.",
  LAB046: "An imaging schedule already exists. Use Reschedule instead.",
  LAB999: "An error occurred while processing the request.",
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
