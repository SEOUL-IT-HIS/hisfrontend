/**
 * 검체(labspecimen) 메시지 코드 사전 (개발표준가이드 15.2)
 *
 * 백엔드 common/LabMessageCode.java 와 코드-문구를 맞춘다.
 */
export const LAB_SPECIMEN_MESSAGES = {
  LAB013: "검사접수 정보를 찾을 수 없습니다.",
  LAB017: "유효하지 않은 코드값입니다.",
  LAB018: "검체 정보가 등록되었습니다.",
  LAB019: "검체 정보 조회에 성공했습니다.",
  LAB020: "등록된 검체 정보를 찾을 수 없습니다.",
  LAB021: "검체 인수 및 적합성 판정이 등록되었습니다.",
  LAB022: "이미 인수/판정이 완료된 검체입니다.",
  LAB998: "필수 항목이 누락되었거나 형식이 올바르지 않습니다.",
  LAB999: "처리 중 오류가 발생했습니다.",
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
