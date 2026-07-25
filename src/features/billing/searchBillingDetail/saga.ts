import { call, put, takeLatest } from "redux-saga/effects";
import { searchBillingDetails } from "@/features/billing/searchBillingDetail/api";
import {
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

export default function* billingDetailSaga() {
  yield takeLatest(searchBillingDetailRequest.type, searchBillingDetailSaga);
}
