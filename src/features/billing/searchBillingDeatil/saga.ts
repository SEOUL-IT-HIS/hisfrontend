import { all, call, put, takeLatest } from "redux-saga/effects";
import { searchBillingDetailRequest, searchBillingDetailSuccess, searchBillingDetailFailure } from "./slice";
import { searchBillingDetailsApi } from "./api";
import axios, { type AxiosResponse } from "axios";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { BillingDetail, BillingDetailSearchCondition } from "./types";

// 공통 에러 처리
function getErrorMessage(e: unknown, defaultMsg: string) {
  if (axios.isAxiosError(e))
    return e.response?.data?.message || defaultMsg;

  return (e as Error)?.message || defaultMsg;
}

function* searchBillingDetailSaga(action: PayloadAction<BillingDetailSearchCondition>) {
    try {
    const response: AxiosResponse<BillingDetail[]> =
      yield call(searchBillingDetailsApi, action.payload);

    yield put(searchBillingDetailSuccess(response.data));

    } catch (e) {
    yield put(searchBillingDetailFailure(getErrorMessage(e, "진료비 상세 조회 실패")));
    }
}

export function* watchBillingDetailSaga() {
    yield all([
      takeLatest(searchBillingDetailRequest.type, searchBillingDetailSaga)
    ]);
}
