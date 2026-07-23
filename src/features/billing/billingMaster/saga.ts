import { all, call, put, takeLatest } from "redux-saga/effects";
import {
    fetchBillingMasterRequest, fetchBillingMasterSuccess, fetchBillingMasterFailure,
    fetchBillingMasterDetailRequest, fetchBillingMasterDetailSuccess, fetchBillingMasterDetailFailure,
    registerBillingMasterRequest, registerBillingMasterSuccess, registerBillingMasterFailure
} from "./slice";
import { fetchBillingMasterAPI, fetchBillingMasterDetailAPI, registerBillingMasterAPI, type ApiResponse } from "./api";
import axios, { type AxiosResponse } from "axios";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { BillingMaster, BillingMasterCreateRequest } from "./types";

// 공통 에러 처리
function getErrorMessage(e: unknown, defaultMsg: string) {
  if (axios.isAxiosError(e))
    return e.response?.data?.message || defaultMsg;

  return (e as Error)?.message || defaultMsg;
}

function* fetchBillingMasterSaga(){
    try{
    const response:AxiosResponse<ApiResponse<BillingMaster[]>> =
      yield call(fetchBillingMasterAPI);

    yield put(fetchBillingMasterSuccess(response.data.data));

    }catch(e){
    yield put(fetchBillingMasterFailure(getErrorMessage(e, "청구 기준 목록 로딩 실패")));
    }
}
function* fetchBillingMasterDetailSaga(action: PayloadAction<string>){
    try{
    const response:AxiosResponse<ApiResponse<BillingMaster>>=
      yield call(fetchBillingMasterDetailAPI,action.payload);

    yield put(fetchBillingMasterDetailSuccess(response.data.data));

    }catch(e){
    yield put(fetchBillingMasterDetailFailure(getErrorMessage(e, "청구 기준 상세 로딩 실패")));
    }
}

function* registerBillingSaga(action: PayloadAction<BillingMasterCreateRequest>){
    try{
    yield call(registerBillingMasterAPI,action.payload);
    yield put(registerBillingMasterSuccess());
    }catch(e){
    yield put(registerBillingMasterFailure(getErrorMessage(e, "청구 기준 등록 실패")));
    }
}

export function* watchBillingMasterSaga(){
    yield all( [
      takeLatest( fetchBillingMasterRequest.type, fetchBillingMasterSaga),
      takeLatest( fetchBillingMasterDetailRequest.type, fetchBillingMasterDetailSaga),
      takeLatest( registerBillingMasterRequest.type, registerBillingSaga)
    ]);
}
