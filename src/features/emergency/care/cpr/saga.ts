import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createCprEvent, getCprEvents } from "@/features/emergency/care/cpr/api";
import {
  createCprFailure,
  createCprRequest,
  createCprSuccess,
  fetchCprFailure,
  fetchCprRequest,
  fetchCprSuccess,
} from "@/features/emergency/care/cpr/slice";
import type { CprCreateRequest, CprEvent } from "@/features/emergency/care/cpr/types";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function* fetchCprSaga(action: PayloadAction<string>) {
  try {
    const items: CprEvent[] = yield call(getCprEvents, action.payload);
    yield put(fetchCprSuccess(items));
  } catch (err) {
    // CPR 기록 조회에 실패했습니다.
    yield put(fetchCprFailure(errorMessage(err, "Failed to load CPR records.")));
  }
}

function* createCprSaga(action: PayloadAction<CprCreateRequest>) {
  try {
    const item: CprEvent = yield call(createCprEvent, action.payload);
    yield put(createCprSuccess(item));
  } catch (err) {
    // CPR 기록 등록에 실패했습니다.
    yield put(createCprFailure(errorMessage(err, "Failed to register CPR record.")));
  }
}

export default function* cprSaga() {
  yield takeLatest(fetchCprRequest.type, fetchCprSaga);
  yield takeLatest(createCprRequest.type, createCprSaga);
}
