/**
 * 수술관리(SUR) 메시지 코드 사전 (개발표준가이드 §15.2)
 *
 * <p>서비스코드 3자리(SUR) + 일련번호 3자리. 백엔드 global/exception/ErrorCode.java 의
 * 코드-문구와 맞춘다. 백엔드 응답 message 가 코드(SUR###)로 내려오면 이 사전으로 변환 후
 * 노출한다(§15.2). 스택트레이스 등 시스템 메시지는 사용자에게 노출하지 않는다(§15.1).</p>
 */
export const SURGERY_MESSAGES = {
  SUR035: "해당 수술이 존재하지 않습니다.",
  SUR036: "해당 수술실이 존재하지 않습니다.",
  SUR037: "해당 장비가 존재하지 않습니다.",
  SUR038: "잘못된 요청입니다.",
  SUR039: "잘못된 수술 상태 값 또는 전이입니다.",
  SUR040: "서버 내부 오류가 발생했습니다.",
  SUR042: "해당 수술기록이 존재하지 않습니다.",
  SUR043: "확정된 수술기록은 수정할 수 없습니다.",
  SUR044: "수술 동의서는 1:1로만 등록할 수 있습니다.",
  SUR045: "점검중이거나 폐쇄된 수술실은 배정할 수 없습니다.",
  SUR046: "해당 동의서가 존재하지 않습니다.",
  SUR047: "수술 동의서가 확인되지 않아 진행할 수 없습니다.",
  SUR048: "해당 마취기록이 존재하지 않습니다.",
  SUR049: "해당 체크리스트 항목이 존재하지 않습니다.",
  SUR050: "해당 예정 자원이 존재하지 않습니다.",
  SUR051: "이전 단계 체크리스트가 완료되지 않았습니다.",
  SUR052: "요청한 자료를 찾을 수 없습니다.",
  SUR053: "허용되지 않는 요청 방식입니다.",
  SUR054: "지원하지 않는 요청 형식입니다.",
} as const;

export type SurgeryMessageCode = keyof typeof SURGERY_MESSAGES;

/**
 * 코드(SUR###)면 문구로 변환하고, 이미 완성된 문구면 그대로 반환한다.
 *
 * <p>백엔드가 완성 문구를 내려주는 경우도 있어 방어적으로 처리한다(§15.2).</p>
 */
export function resolveSurgeryMessage(message: string): string {
  if (message in SURGERY_MESSAGES) {
    return SURGERY_MESSAGES[message as SurgeryMessageCode];
  }
  return message;
}
