/**
 * emergency(EMG) 서비스 공통 에러코드 문구 사전
 *
 * 백엔드 common/config/EmergencyExceptionHandler.java 의 에러코드와 문구를 맞춘다.
 * (kr.co.seoulit.his.emergencyservice.common.config.EmergencyExceptionHandler)
 * 백엔드 응답 message 가 코드로 내려오면 이 사전으로 문구 변환 후 노출한다.
 */
export const EMERGENCY_MESSAGES = {
  // 요청 값이 올바르지 않습니다.
  EMG_BAD_REQUEST: "The request value is invalid.",
  // 로그인이 필요합니다.
  EMG_UNAUTHENTICATED: "Please sign in to continue.",
  // 조회하려는 대상을 찾을 수 없습니다.
  EMG_NOT_FOUND: "The requested item could not be found.",
  // 현재 상태와 충돌하는 요청입니다.
  EMG_CONFLICT: "This request conflicts with the current state.",
  // 서버 내부 오류가 발생했습니다.
  EMG_INTERNAL_ERROR: "An internal server error occurred.",
  // 연계 서비스(처방코어 등)가 응답하지 않거나 오류를 돌려줬습니다.
  EMG_UPSTREAM_ERROR: "The order service is not responding. Please try again later.",
} as const;

export type EmergencyMessageCode = keyof typeof EMERGENCY_MESSAGES;

/** 서버가 409(EMG_CONFLICT)로 주는 영문 사유(뒤에 접수 ID 가 붙는다)를 직원이 알아볼 문장으로 바꾼다 */
const CONFLICT_REASON_MESSAGES: ReadonlyArray<readonly [RegExp, string]> = [
  // 접수에서 취소한 접수에는 새로 등록할 수 없습니다.
  [/^reception cancelled\b/, "This reception was cancelled at reception. New entries cannot be registered."],
  // 퇴실 처리가 끝난 환자에게는 새로 등록할 수 없습니다.
  [/^reception already discharged\b/, "This patient has already been discharged. New entries cannot be registered here."],
  // 투약·CPR·동의의 시각이 범위(접수 이후, 현재 이전, 귀가·사망·자의퇴원이면 퇴실 이전)를 벗어났습니다.
  [/must not be in the future$/, "The time cannot be in the future."],
  [/must not be before the reception time$/, "The time cannot be earlier than the reception time."],
  [/must not be after the discharge time$/, "The time cannot be later than the discharge time."],
  // 취소된 처방은 약제로 보낼 수 없습니다(처방코어 OPD005).
  [/^order core conflict \(dispatch pharmacy\)/, "The pharmacy cannot accept this order (it may already be cancelled)."],
];

/**
 * 코드(EMG_*)면 문구로 변환하고, 이미 완성 문구면 그대로 반환한다.
 * 접수 취소·퇴실로 막힌 요청(서버 사유 문구)은 알아볼 수 있는 문장으로 바꾼다.
 */
export function resolveEmergencyMessage(codeOrMessage: string): string {
  if (codeOrMessage in EMERGENCY_MESSAGES) {
    return EMERGENCY_MESSAGES[codeOrMessage as EmergencyMessageCode];
  }
  const reason = CONFLICT_REASON_MESSAGES.find(([pattern]) => pattern.test(codeOrMessage));
  return reason ? reason[1] : codeOrMessage;
}
