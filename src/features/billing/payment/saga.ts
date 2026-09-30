import { call, put, takeLatest } from "redux-saga/effects";
import {
  requestKakaoPayApproveApi,
  requestKakaoPayReadyApi,
  requestPaymentApi,
} from "@/features/billing/payment/api";
import {
  kakaoPayApproveFailure,
  kakaoPayApproveRequest,
  kakaoPayApproveSuccess,
  kakaoPayReadyFailure,
  kakaoPayReadyRequest,
  paymentFailure,
  paymentRequest,
  paymentSuccess,
} from "@/features/billing/payment/slice";
import type { PayloadAction } from "@reduxjs/toolkit";
import type {
  KakaoPayApprovePayload,
  KakaoPayReadyPayload,
  PaymentRequestPayload,
} from "@/features/billing/payment/types";

function* paymentRequestSaga(action: PayloadAction<PaymentRequestPayload>) {
  try {
    yield call(requestPaymentApi, action.payload);
    yield put(paymentSuccess());
  } catch (err) {
    const message = err instanceof Error ? err.message : "결제 처리에 실패했습니다.";
    yield put(paymentFailure(message));
  }
}

// billingId만 넘기면 되므로 KAKAO_PAY 여부 분기는 필요 없음 - 이 saga 자체가 kakaoPayReadyRequest 액션 전용
function* kakaoPayReadyRequestSaga(action: PayloadAction<KakaoPayReadyPayload>) {
  try {
    const { redirectUrl } = yield call(requestKakaoPayReadyApi, action.payload);
    window.location.href = redirectUrl; // 카카오페이 결제창으로 이동, 이 시점에 화면을 벗어남
  } catch (err) {
    const message = err instanceof Error ? err.message : "결제 준비에 실패했습니다.";
    yield put(kakaoPayReadyFailure(message));
  }
}

// 카카오페이 결제창에서 돌아온 콜백 페이지가 dispatch
function* kakaoPayApproveRequestSaga(action: PayloadAction<KakaoPayApprovePayload>) {
  try {
    yield call(requestKakaoPayApproveApi, action.payload);
    yield put(kakaoPayApproveSuccess());
  } catch (err) {
    const message = err instanceof Error ? err.message : "결제 승인에 실패했습니다.";
    yield put(kakaoPayApproveFailure(message));
  }
}

export default function* billingPaymentSaga() {
  yield takeLatest(paymentRequest.type, paymentRequestSaga);
  yield takeLatest(kakaoPayReadyRequest.type, kakaoPayReadyRequestSaga);
  yield takeLatest(kakaoPayApproveRequest.type, kakaoPayApproveRequestSaga);
}
