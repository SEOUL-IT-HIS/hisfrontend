/**
 * admin-service 메시지 코드 (개발표준가이드 15.2)
 * 백엔드 ErrorCode 와 동일한 코드-문구 매핑
 */
export const ADM_MESSAGES = {
  ADM001: "이미 등록된 사번입니다.",
  ADM002: "이미 사용 중인 로그인 ID입니다.",
  ADM003: "직원 정보를 찾을 수 없습니다.",
  ADM004: "요청 값이 올바르지 않습니다.",
  SUCCESS: "처리되었습니다.",
  INTERNAL_ERROR: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
} as const;

export type AdmMessageCode = keyof typeof ADM_MESSAGES;

export function resolveAdmMessage(codeOrMessage: string): string {
  if (codeOrMessage in ADM_MESSAGES) {
    return ADM_MESSAGES[codeOrMessage as AdmMessageCode];
  }
  return codeOrMessage;
}
