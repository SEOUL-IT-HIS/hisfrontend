import { call, put, takeLatest } from "redux-saga/effects";
import type { AxiosResponse } from "axios";
import {
  createBillingMasterAPI,
  fetchBillingMasterAPI,
  fetchBillingMasterDetailAPI,
  updateBillingMasterAPI,
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
  updateBillingMasterFailure,
  updateBillingMasterRequest,
  updateBillingMasterSuccess,
} from "@/features/billing/billingMaster/slice";
import type { PayloadAction } from "@reduxjs/toolkit";
import type {
  BillingMaster,
  BillingMasterCreateRequest,
  BillingMasterUpdateRequest,
} from "@/features/billing/billingMaster/types";

function* fetchBillingMasterSaga() {
  try {
    const response: AxiosResponse<ApiResponse<BillingMaster[]>> = yield call(fetchBillingMasterAPI);
    yield put(fetchBillingMasterSuccess(response.data.data));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load billing masters.";
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
    const message = err instanceof Error ? err.message : "Failed to load billing master detail.";
    yield put(fetchBillingMasterDetailFailure(message));
  }
}

function* registerBillingMasterSaga(action: PayloadAction<BillingMasterCreateRequest>) {
  try {
    yield call(createBillingMasterAPI, action.payload);
    yield put(registerBillingMasterSuccess());
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to register billing master.";
    yield put(registerBillingMasterFailure(message));
  }
}

function* updateBillingMasterSaga(
  action: PayloadAction<{ billingMasterId: string; payload: BillingMasterUpdateRequest }>,
) {
  try {
    yield call(updateBillingMasterAPI, action.payload.billingMasterId, action.payload.payload);
    yield put(updateBillingMasterSuccess());
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update billing master.";
    yield put(updateBillingMasterFailure(message));
  }
}

export default function* billingMasterSaga() {
  yield takeLatest(fetchBillingMasterRequest.type, fetchBillingMasterSaga);
  yield takeLatest(fetchBillingMasterDetailRequest.type, fetchBillingMasterDetailSaga);
  yield takeLatest(registerBillingMasterRequest.type, registerBillingMasterSaga);
  yield takeLatest(updateBillingMasterRequest.type, updateBillingMasterSaga);
}
