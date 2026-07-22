import { all, call, put, takeLatest } from "redux-saga/effects";
import { deleteEmpFailure, deleteEmpRequest, deleteEmpSuccess, 
    fetchEmpDetailFailure, fetchEmpDetailRequest, fetchEmpDetailSuccess,
     fetchEmpFailure, fetchEmpRequest, fetchEmpSuccess, 
     registerEmpFailure, registerEmpRequest, registerEmpSuccess, 
     updateEmpFailure, updateEmpRequest, updateEmpSuccess 
    } from "./slice";
import { ApiResponse, deleteEmpAPI, fetchEmpAPI, fetchEmpDetailAPI, registerEmpAPI, updateEmpAPI } from "./api";
import axios, { AxiosResponse } from "axios";
import { PayloadAction } from "@reduxjs/toolkit";
import { Emp } from "./types";

// 공통 에러 처리
function getErrorMessage(e: unknown, defaultMsg: string) {
  if (axios.isAxiosError(e))
    return e.response?.data?.message || defaultMsg;

  return (e as any)?.message || defaultMsg;
}

function* fetchBillingMasterSaga(){
    try{
    const response:AxiosResponse<ApiResponse<Emp[]>> =
      yield call(fetchEmpAPI);

    yield put(fetchEmpSuccess(response.data.data));

    }catch(e){
    yield put(fetchEmpFailure(getErrorMessage(e, "회원 목록 로딩 실패")));
    }
}
function* fetchBillingMasterDetailSaga(action: PayloadAction<string>){
    try{
    console.log(action.payload);

    const response:AxiosResponse<ApiResponse<Emp>>=
      yield call(fetchEmpDetailAPI,action.payload);
    console.log(response.data);

    yield put(fetchEmpDetailSuccess(response.data.data));

    }catch(e){
    console.log(e);
    yield put(fetchEmpDetailFailure(getErrorMessage(e, "회원 상세 로딩 실패")));
    }
}

function* registerBillingSaga(action: PayloadAction<Emp>){
    try{
    yield call(registerEmpAPI,action.payload);
        // action.payload api에서 객체emp를 받음
    yield put(registerEmpSuccess());
    }catch(e){
    yield put(registerEmpFailure(getErrorMessage(e, "회원 가입 실패")));
    }
}

export function* watchBillingMasterSaga(){
    yield all( [
      takeLatest( fetchBillingMasterRequest.type, fetchBillingMasterSaga),
      takeLatest( fetchBillingMasterDetailRequest.type, fetchBillingMasterDetailSaga),
      takeLatest( registerBillingMaster.type, registerBillingSaga)
    ]);
}