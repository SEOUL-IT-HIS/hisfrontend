/**
 * 수납/청구(BIL) 서비스 공통 타입
 *
 * <p>billingMaster, searchBillingDetail 등 billing 하위 기능이 공통으로 쓰는
 * API 응답 포맷을 여기에 둔다.</p>
 */

/** 공통 API 응답 포맷 */
export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};
