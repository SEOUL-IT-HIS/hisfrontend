import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/billing/types";
import type { PaymentRequestPayload } from "@/features/billing/payment/types";

const BILLING_PAYMENT_PATH = "/api/billing/payment";

/** 결제 요청 */
export async function requestPaymentApi(payload: PaymentRequestPayload): Promise<void> {
  await apiClient.post<ApiResponse<void>>(BILLING_PAYMENT_PATH, payload);
}
