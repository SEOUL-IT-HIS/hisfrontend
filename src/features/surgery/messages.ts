/**
 * 수술관리(SUR) 메시지 코드 사전 (개발표준가이드 §15.2)
 *
 * <p>서비스코드 3자리(SUR) + 일련번호 3자리. 백엔드 common/exception/ErrorCode.java 의
 * 코드-문구와 맞춘다. 백엔드 응답 message 가 코드(SUR###)로 내려오면 이 사전으로 변환 후
 * 노출한다(§15.2). 스택트레이스 등 시스템 메시지는 사용자에게 노출하지 않는다(§15.1).</p>
 *
 * <p><b>문구는 영어로 쓴다</b>(§12.4, 2026-08-31 결정). 화면에 노출되는 모든 문자열이
 * 대상이고 성공·예외 메시지도 포함된다. 한글은 인명·환자명 같은 고유명사 데이터만
 * 남는데, 그런 값은 여기 사전이 아니라 서버에서 온다.</p>
 */
export const SURGERY_MESSAGES = {
  SUR035: "Surgery not found.",
  SUR036: "Operating room not found.",
  SUR037: "Equipment not found.",
  SUR038: "Invalid request.",
  SUR039: "Invalid surgery status or transition.",
  SUR040: "An internal server error occurred.",
  SUR042: "Operative record not found.",
  SUR043: "A finalized operative record cannot be modified.",
  SUR044: "Only one consent of each type can be registered per surgery.",
  SUR045: "A room under maintenance or closed cannot be assigned.",
  SUR046: "Consent not found.",
  // 수술·마취·비용견적 동의서에 공통으로 쓴다. 종류를 문구에 박으면
  // 마취 기록 등록에서 이 오류를 받았을 때 "수술 동의서는 냈는데?" 하고 헷갈린다.
  // (문구는 영어 — §12.4. 주석은 그대로 한글이다, §16)
  SUR047: "Consent has not been confirmed, so this cannot proceed.",
  SUR048: "Anesthesia record not found.",
  SUR049: "Checklist item not found.",
  SUR050: "Planned item not found.",
  SUR051: "The previous checklist phase has not been completed.",
  SUR052: "The requested resource was not found.",
  SUR053: "This request method is not allowed.",
  SUR054: "This request format is not supported.",
  SUR055: "Surgical procedure not found.",
  SUR056: "This procedure code is already registered.",
  SUR057: "Surgery order not found.",
  SUR058: "This surgery order has already been processed.",
  SUR059:
    "Assignment is fixed once the order is approved. To change it, cancel the surgery and have it requested again.",
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
