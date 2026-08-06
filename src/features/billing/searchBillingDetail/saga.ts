import { call, put, takeLatest } from "redux-saga/effects";
import { fetchBillingDetail, searchBillingDetails } from "@/features/billing/searchBillingDetail/api";
import {
  fetchBillingDetailFailure,
  fetchBillingDetailRequest,
  fetchBillingDetailSuccess,
  searchBillingDetailFailure,
  searchBillingDetailRequest,
  searchBillingDetailSuccess,
} from "@/features/billing/searchBillingDetail/slice";
import type { PayloadAction } from "@reduxjs/toolkit";
import type {
  BillingDetail,
  BillingDetailSearchCondition,
} from "@/features/billing/searchBillingDetail/types";

function* searchBillingDetailSaga(action: PayloadAction<BillingDetailSearchCondition>) {
  try {
    const result: BillingDetail[] = yield call(searchBillingDetails, action.payload);
    yield put(searchBillingDetailSuccess(result));
  } catch (err) {
    const message = err instanceof Error ? err.message : "진료비 상세조회에 실패했습니다.";
    yield put(searchBillingDetailFailure(message));
  }
}

function* fetchBillingDetailSaga(action: PayloadAction<string>) {
  try {
    const result: BillingDetail = yield call(fetchBillingDetail, action.payload);
    yield put(fetchBillingDetailSuccess(result));
  } catch (err) {
    const message = err instanceof Error ? err.message : "진료비 상세 조회에 실패했습니다.";
    yield put(fetchBillingDetailFailure(message));
  }
}

export default function* billingDetailSaga() {
  yield takeLatest(searchBillingDetailRequest.type, searchBillingDetailSaga);
  yield takeLatest(fetchBillingDetailRequest.type, fetchBillingDetailSaga);
}
