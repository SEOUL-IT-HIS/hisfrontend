/**
 * auth 메시지 코드 (개발표준가이드 15.2)
 * 백엔드 ErrorCode 와 동일한 코드-문구 매핑
 */
export const AUTH_MESSAGES = {
  ADM005: "로그인 ID 또는 비밀번호가 올바르지 않습니다.",
  ADM006: "잠긴 계정입니다. 관리자에게 문의해주세요.",
  ADM007: "비활성화된 계정입니다. 관리자에게 문의해주세요.",
  ADM004: "요청 값이 올바르지 않습니다.",
  SUCCESS: "로그인되었습니다.",
  INTERNAL_ERROR: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
} as const;

export type AuthMessageCode = keyof typeof AUTH_MESSAGES;

export function resolveAuthMessage(codeOrMessage: string): string {
  if (codeOrMessage in AUTH_MESSAGES) {
    return AUTH_MESSAGES[codeOrMessage as AuthMessageCode];
  }
  return codeOrMessage;
}
