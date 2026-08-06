import { call, put, takeLatest } from "redux-saga/effects";
import { searchPatientApi,
         fetchBillingDetailApi,
         admissionBillingDetailApi,
         visitBillingDetailApi
 } from "@/features/billing/searchBillingDetail/api";
import {
  admissionBillingDetailFailure,
  admissionBillingDetailRequest,
  admissionBillingDetailSuccess,
  fetchBillingDetailFailure,
  fetchBillingDetailRequest,
  fetchBillingDetailSuccess,
  searchBillingDetailFailure,
  searchBillingDetailRequest,
  searchBillingDetailSuccess,
  visitBillingDetailFailure,
  visitBillingDetailRequest,
  visitBillingDetailSuccess,
} from "@/features/billing/searchBillingDetail/slice";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { BillingDetail,
              BillingDetailAdmission, BillingDetailVisit, SearchPatient, SearchPatientResult } from "@/features/billing/searchBillingDetail/types";

function* searchBillingDetailSaga(action: PayloadAction<SearchPatient>) {
  try {
    const result: SearchPatientResult[] = yield call(searchPatientApi, action.payload);
    yield put(searchBillingDetailSuccess(result));
  } catch (err) {
    const message = err instanceof Error ? err.message : "진료비 상세조회에 실패했습니다.";
    yield put(searchBillingDetailFailure(message));
  }
}

function* fetchBillingDetailSaga(action: PayloadAction<string>) {
  try {
    const result: BillingDetail = yield call(fetchBillingDetailApi, action.payload);
    yield put(fetchBillingDetailSuccess(result));
  } catch (err) {
    const message = err instanceof Error ? err.message : "진료비 상세 조회에 실패했습니다.";
    yield put(fetchBillingDetailFailure(message));
  }
}

function* admissionBillingDetailSaga(action: PayloadAction<string>) {
  try {
    const result: BillingDetailAdmission = yield call( admissionBillingDetailApi, action.payload);
    yield put(admissionBillingDetailSuccess(result));
  } catch (err) {
    const message = err instanceof Error ? err.message : "입퇴원 상세 조회에 실패했습니다.";
    yield put(admissionBillingDetailFailure(message));
  }
}

function* visitBillingDetailSaga(action: PayloadAction<string>) {
  try {
    const result: BillingDetailVisit = yield call( visitBillingDetailApi, action.payload);
    yield put(visitBillingDetailSuccess(result));
  } catch (err) {
    const message = err instanceof Error ? err.message : "진료비 상세 조회에 실패했습니다.";
    yield put(visitBillingDetailFailure(message));
  }
}
export default function* billingDetailSaga() {
  yield takeLatest(searchBillingDetailRequest.type, searchBillingDetailSaga);
  yield takeLatest(fetchBillingDetailRequest.type, fetchBillingDetailSaga);
  yield takeLatest(admissionBillingDetailRequest.type, admissionBillingDetailSaga);
  yield takeLatest(visitBillingDetailRequest.type, visitBillingDetailSaga);
}
