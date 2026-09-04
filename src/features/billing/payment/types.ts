/** 결제 수단 코드 */
export type PaymentMethodCode = "CASH" | "CARD" | "KAKAO_PAY";

/** 결제 요청 */
export type PaymentRequestPayload = {
  billingId: string;
  paymentMethodCode: PaymentMethodCode;
};

export type KakaoPayReadyPayload = {
  billingId: string;
};

export type KakaoPayReadyResponse = {
  redirectUrl: string;// 결제 준비 요청에 대한 응답 URL
};

/** 카카오페이 결제 승인 - 카카오페이 결제창에서 돌아온 뒤 pgToken 을 붙여 호출 */
export type KakaoPayApprovePayload = {
  billingId: string;
  pgToken: string;
};
