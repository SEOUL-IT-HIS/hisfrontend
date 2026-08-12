/** 결제 수단 코드 */
export type PaymentMethodCode = "CASH" | "CARD" | "KAKAO_PAY";

/** 결제 요청 */
export type PaymentRequestPayload = {
  billingId: string;
  paymentMethodCode: PaymentMethodCode;
};
