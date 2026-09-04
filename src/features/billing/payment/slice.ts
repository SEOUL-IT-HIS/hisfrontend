import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  KakaoPayApprovePayload,
  KakaoPayReadyPayload,
  PaymentRequestPayload,
} from "@/features/billing/payment/types";

/**
 * billingPayment slice
 * - 결제 처리 상태만 관리, API 호출은 saga 가 담당
 */
type PaymentState = {
  loading: boolean;
  error: string;
  success: boolean;
};

const initialState: PaymentState = {
  loading: false,
  error: "",
  success: false,
};

const billingPaymentSlice = createSlice({
  name: "billingPayment",
  initialState,
  reducers: {
    /** 결제 요청 시작 → saga 가 이 action 을 듣고 API 호출 */
    paymentRequest(state, _action: PayloadAction<PaymentRequestPayload>) {
      state.loading = true;
      state.error = "";
      state.success = false;
    },
    /** 결제 요청 성공 */
    paymentSuccess(state) {
      state.loading = false;
      state.error = "";
      state.success = true;
    },
    /** 결제 요청 실패 */
    paymentFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
      state.success = false;
    },
    /** 결제 모달 재오픈 시 상태 초기화 */
    resetPayment(state) {
      state.loading = false;
      state.error = "";
      state.success = false;
    },
    /** 카카오페이 결제 준비 요청 시작 → saga 가 이 action 을 듣고 ready API 호출 */
    kakaoPayReadyRequest(state, _action: PayloadAction<KakaoPayReadyPayload>) {
      state.loading = true;
      state.error = "";
      state.success = false;
    },
    /** 카카오페이 결제 준비 성공 (실제로는 곧바로 리다이렉트되어 화면을 벗어남) */
    kakaoPayReadySuccess(state) {
      state.loading = false;
    },
    /** 카카오페이 결제 준비 실패 */
    kakaoPayReadyFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    /** 카카오페이 결제 승인 요청 시작 (콜백 페이지에서 dispatch) → saga 가 approve API 호출 */
    kakaoPayApproveRequest(state, _action: PayloadAction<KakaoPayApprovePayload>) {
      state.loading = true;
      state.error = "";
      state.success = false;
    },
    /** 카카오페이 결제 승인 성공 */
    kakaoPayApproveSuccess(state) {
      state.loading = false;
      state.error = "";
      state.success = true;
    },
    /** 카카오페이 결제 승인 실패 */
    kakaoPayApproveFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
      state.success = false;
    },
  },
});

export const {
  paymentRequest,
  paymentSuccess,
  paymentFailure,
  resetPayment,
  kakaoPayReadyRequest,
  kakaoPayReadySuccess,
  kakaoPayReadyFailure,
  kakaoPayApproveRequest,
  kakaoPayApproveSuccess,
  kakaoPayApproveFailure,
} = billingPaymentSlice.actions;

export default billingPaymentSlice.reducer;

// ----- Selector (가이드 10.4: 컴포넌트에서 state.xxx.yyy 깊게 파지 않기) -----

type BillingPaymentRoot = { billingPayment: PaymentState };

export const selectBillingPaymentLoading = (state: BillingPaymentRoot) =>
  state.billingPayment.loading;
export const selectBillingPaymentError = (state: BillingPaymentRoot) => state.billingPayment.error;
export const selectBillingPaymentSuccess = (state: BillingPaymentRoot) =>
  state.billingPayment.success;
