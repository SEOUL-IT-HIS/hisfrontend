import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/billing/types";
import type {
  KakaoPayApprovePayload,
  KakaoPayReadyPayload,
  PaymentRequestPayload,
} from "@/features/billing/payment/types";

const BILLING_PAYMENT_PATH = "/api/billing/payment/payment";
const KAKAO_PAY_READY_PATH = "/api/billing/payment/ready";
const KAKAO_PAY_APPROVE_PATH = "/api/billing/payment/approve";


/** 결제 요청 */
export async function requestPaymentApi(payload: PaymentRequestPayload): Promise<void> {
  await apiClient.post<ApiResponse<void>>(BILLING_PAYMENT_PATH, payload);
}

/** KakaoPay 준비 요청 **/
export async function requestKakaoPayReadyApi(payload: KakaoPayReadyPayload): Promise<{ redirectUrl: string }> {
  const response = await apiClient.post<ApiResponse<{ redirectUrl: string }>>(KAKAO_PAY_READY_PATH, payload);
  return response.data.data;
}

//** KakaoPay 승인 요청 **/
export async function requestKakaoPayApproveApi(payload: KakaoPayApprovePayload): Promise<void> {
  await apiClient.post<ApiResponse<void>>(KAKAO_PAY_APPROVE_PATH, payload);
}
