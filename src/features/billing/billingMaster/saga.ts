import { call, put, takeLatest } from "redux-saga/effects";
import type { AxiosResponse } from "axios";
import {
  createBillingMasterAPI,
  fetchBillingMasterAPI,
  fetchBillingMasterDetailAPI,
} from "@/features/billing/billingMaster/api";
import type { ApiResponse } from "@/features/billing/types";
import {
  fetchBillingMasterDetailFailure,
  fetchBillingMasterDetailRequest,
  fetchBillingMasterDetailSuccess,
  fetchBillingMasterFailure,
  fetchBillingMasterRequest,
  fetchBillingMasterSuccess,
  registerBillingMasterFailure,
  registerBillingMasterRequest,
  registerBillingMasterSuccess,
} from "@/features/billing/billingMaster/slice";
import type { PayloadAction } from "@reduxjs/toolkit";
import type {
  BillingMaster,
  BillingMasterCreateRequest,
} from "@/features/billing/billingMaster/types";

function* fetchBillingMasterSaga() {
  try {
    const response: AxiosResponse<ApiResponse<BillingMaster[]>> = yield call(fetchBillingMasterAPI);
    yield put(fetchBillingMasterSuccess(response.data.data));
  } catch (err) {
    const message = err instanceof Error ? err.message : "수납 기준정보 목록 조회에 실패했습니다.";
    yield put(fetchBillingMasterFailure(message));
  }
}

function* fetchBillingMasterDetailSaga(action: PayloadAction<string>) {
  try {
    const response: AxiosResponse<ApiResponse<BillingMaster>> = yield call(
      fetchBillingMasterDetailAPI,
      action.payload,
    );
    yield put(fetchBillingMasterDetailSuccess(response.data.data));
  } catch (err) {
    const message = err instanceof Error ? err.message : "수납 기준정보 상세 조회에 실패했습니다.";
    yield put(fetchBillingMasterDetailFailure(message));
  }
}

function* registerBillingMasterSaga(action: PayloadAction<BillingMasterCreateRequest>) {
  try {
    yield call(createBillingMasterAPI, action.payload);
    yield put(registerBillingMasterSuccess());
  } catch (err) {
    const message = err instanceof Error ? err.message : "수납 기준정보 등록에 실패했습니다.";
    yield put(registerBillingMasterFailure(message));
  }
}

export default function* billingMasterSaga() {
  yield takeLatest(fetchBillingMasterRequest.type, fetchBillingMasterSaga);
  yield takeLatest(fetchBillingMasterDetailRequest.type, fetchBillingMasterDetailSaga);
  yield takeLatest(registerBillingMasterRequest.type, registerBillingMasterSaga);
}
