import { call, put, takeLatest } from "redux-saga/effects";
import { requestPaymentApi } from "@/features/billing/payment/api";
import { paymentFailure, paymentRequest, paymentSuccess } from "@/features/billing/payment/slice";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { PaymentRequestPayload } from "@/features/billing/payment/types";

function* paymentRequestSaga(action: PayloadAction<PaymentRequestPayload>) {
  try {
    yield call(requestPaymentApi, action.payload);
    yield put(paymentSuccess());
  } catch (err) {
    const message = err instanceof Error ? err.message : "결제 처리에 실패했습니다.";
    yield put(paymentFailure(message));
  }
}

export default function* billingPaymentSaga() {
  yield takeLatest(paymentRequest.type, paymentRequestSaga);
}
