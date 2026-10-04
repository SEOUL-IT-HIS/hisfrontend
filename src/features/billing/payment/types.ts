/** 결제 수단 코드 */
export type PaymentMethodCode = "CASH" | "CARD" | "KAKAO_PAY";

/** 결제 요청 - 환자의 미수납 건 여러 개를 한 번에 결제 */
export type PaymentRequestPayload = {
  billingIds: string[];
  paymentMethodCode: PaymentMethodCode;
};

export type KakaoPayReadyPayload = {
  billingIds: string[];
};

export type KakaoPayReadyResponse = {
  redirectUrl: string;// 결제 준비 요청에 대한 응답 URL
};

/** 카카오페이 결제 승인 - 카카오페이 결제창에서 돌아온 뒤 pgToken 을 붙여 호출 */
export type KakaoPayApprovePayload = {
  billingId: string;      // ready 때 tid를 저장한 대표 billingId
  billingIds?: string[];  // 여러 건을 묶어 결제한 경우 전체 목록
  pgToken: string;
};
