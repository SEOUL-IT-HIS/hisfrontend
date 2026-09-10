import { call, put, takeLatest } from "redux-saga/effects";
import { searchBillingHistoryApi, fetchBillingHistoryByPatientApi } from "@/features/billing/history/api";
import {
  searchBillingHistoryRequest,
  searchBillingHistorySuccess,
  searchBillingHistoryFailure,
  fetchBillingHistoryDetailRequest,
  fetchBillingHistoryDetailSuccess,
  fetchBillingHistoryDetailFailure,
} from "./slice";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { SearchPatient, SearchPatientResult, BillingHistoryItem } from "./types";

function* searchBillingHistorySaga(action: PayloadAction<SearchPatient>) {
  try {
    const result: SearchPatientResult[] = yield call(searchBillingHistoryApi, action.payload);
    yield put(searchBillingHistorySuccess(result));
  } catch (err) {
    const message = err instanceof Error ? err.message : "수납이력 검색에 실패했습니다.";
    yield put(searchBillingHistoryFailure(message));
  }
}

function* fetchBillingHistoryDetailSaga(action: PayloadAction<string>) {
  try {
    const result: BillingHistoryItem[] = yield call(fetchBillingHistoryByPatientApi, action.payload);
    yield put(fetchBillingHistoryDetailSuccess(result));
  } catch (err) {
    const message = err instanceof Error ? err.message : "수납이력 상세 조회에 실패했습니다.";
    yield put(fetchBillingHistoryDetailFailure(message));
  }
}

export default function* billingHistorySaga() {
  yield takeLatest(searchBillingHistoryRequest.type, searchBillingHistorySaga);
  yield takeLatest(fetchBillingHistoryDetailRequest.type, fetchBillingHistoryDetailSaga);
}
