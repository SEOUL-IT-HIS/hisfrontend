/**
 * 수술 saga 공용 오류 문구 헬퍼
 *
 * <p>왜 필요한가 — lib/axios.ts 의 interceptor 는 모든 서비스가 공유하므로
 * 그쪽에서 문구를 세분화하면 남의 화면까지 바뀐다. 그래서 수술 쪽 문구 판단은
 * 여기에 모아 두고 saga 에서만 쓴다.</p>
 *
 * <p>구분이 필요한 이유 — 지금까지는 서버가 꺼진 경우와 서버 내부 오류가
 * 같은 문구로 보였다. MSA 라 개발 중에 남의 서비스가 자주 내려가는데,
 * 화면만 보고는 "내 코드가 틀렸는지 / 저쪽이 안 떠 있는지" 알 수 없었다.</p>
 *
 * <p>판단 순서 —
 * ① 백엔드가 준 message(SUR### 코드 포함) → ② 응답 자체가 없음(연결 실패)
 * → ③ 5xx(서버 오류) → ④ 그 외 Error → ⑤ 호출부가 준 기본 문구</p>
 */
import { isAxiosError } from "axios";
import { resolveSurgeryMessage } from "@/features/surgery/messages";

type SurgeryErrorResponse = {
  /** 백엔드 ApiResponse.message — SUR### 코드이거나 완성된 문구다(§11.3) */
  message?: string;
};

/**
 * 예외를 사용자에게 보여줄 한 줄 문구로 바꾼다.
 *
 * @param error    catch 로 잡은 값. 타입을 알 수 없으므로 unknown 이다.
 * @param fallback 아무것도 판단할 수 없을 때 쓸 기본 문구.
 */
export function getSurgeryErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (isAxiosError<SurgeryErrorResponse>(error)) {
    // ① 백엔드가 내려준 문구가 가장 정확하다.
    //    SUR### 코드로 오는 경우가 있어 사전 변환을 거친다(§15.2).
    const responseMessage = error.response?.data?.message;
    if (responseMessage) {
      return resolveSurgeryMessage(responseMessage);
    }

    // ② 응답 객체 자체가 없다 = 요청이 서버에 닿지 못했다.
    //    서버가 안 떠 있거나, 네트워크가 다르거나, 타임아웃이다.
    if (!error.response) {
      return "Cannot reach the server. Please try again shortly.";
    }

    // ③ 닿기는 했는데 서버 안에서 터졌다. 사용자가 할 수 있는 일은 없다.
    if (error.response.status >= 500) {
      return "A server error occurred. Please try again shortly.";
    }
  }

  // ④ axios 오류가 아닌 일반 예외(코드 버그 등).
  //    시스템 메시지를 그대로 노출하지 않도록 여기서도 사전을 거친다(§15.1).
  if (error instanceof Error && error.message) {
    return resolveSurgeryMessage(error.message);
  }

  // ⑤ 문자열도 Error 도 아닌 값이 던져진 경우.
  return fallback;
}
