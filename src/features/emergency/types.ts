/**
 * emergency 서비스 도메인 공통 API 응답 포맷 (개발표준가이드 11.3)
 * 백엔드 common/ApiResponse.java 와 1:1 대응한다.
 * (참고: kr.co.seoulit.his.emergencyservice.common.ApiResponse)
 *
 * code 는 문자열("SUCCESS" 또는 "EMG_BAD_REQUEST" 등 에러코드)로 내려온다.
 */
export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}
