/**
 * emergency(EMG) 서비스 공통 에러코드 문구 사전
 *
 * 백엔드 common/config/EmergencyExceptionHandler.java 의 에러코드와 문구를 맞춘다.
 * (kr.co.seoulit.his.emergencyservice.common.config.EmergencyExceptionHandler)
 * 백엔드 응답 message 가 코드로 내려오면 이 사전으로 문구 변환 후 노출한다.
 */
export const EMERGENCY_MESSAGES = {
  EMG_BAD_REQUEST: "요청 값이 올바르지 않습니다.",
  EMG_NOT_FOUND: "조회하려는 대상을 찾을 수 없습니다.",
  EMG_CONFLICT: "현재 상태와 충돌하는 요청입니다.",
  EMG_INTERNAL_ERROR: "서버 내부 오류가 발생했습니다.",
} as const;

export type EmergencyMessageCode = keyof typeof EMERGENCY_MESSAGES;

/**
 * 코드(EMG_*)면 문구로 변환하고, 이미 완성 문구면 그대로 반환한다.
 */
export function resolveEmergencyMessage(codeOrMessage: string): string {
  if (codeOrMessage in EMERGENCY_MESSAGES) {
    return EMERGENCY_MESSAGES[codeOrMessage as EmergencyMessageCode];
  }
  return codeOrMessage;
}
