/**
 * labImaging 서비스 도메인 공통 API 응답 포맷 (개발표준가이드 11.3)
 *
 * 백엔드 common/dto/ApiResponse.java 와 1:1 대응한다.
 * (참고: kr.co.seoulit.his.labimagingservice.common.dto.ApiResponse)
 *
 * 왜 code 가 string 인가:
 * - 가이드 11.3 예시는 code 를 숫자(200)로 표기하지만, lab-imaging-service 백엔드는
 *   code 를 문자열 메시지코드(LAB001, LAB005 등)로 내려준다.
 * - 성공/실패 1차 판정은 HTTP status 기반으로 공통 axios interceptor(lib/axios.ts)에서
 *   처리되고(2xx resolve / 4xx·5xx reject), code·message 는 사용자 노출 문구 변환에만 쓴다.
 * - 실제 백엔드 스펙 대조 결과를 반영한 것이며, 이 상이점은 리더/백엔드와 최종 확정이 필요하다.
 */
export interface ApiResponse<T> {
  /** 결과 코드 (예: "LAB001") — 숫자 HTTP status 가 아니라 메시지 코드 문자열 */
  code: string;
  /** 결과 메시지 (완성 문구 또는 LAB### 코드) */
  message: string;
  /** 실제 응답 데이터 (실패 시 백엔드가 null 을 내려줄 수 있음) */
  data: T;
}
