import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createDisposition, getDispositions } from "@/features/emergency/disposition/api";
import {
  fetchDispositionsFailure,
  fetchDispositionsRequest,
  fetchDispositionsSuccess,
  createDispositionFailure,
  createDispositionRequest,
  createDispositionSuccess,
} from "@/features/emergency/disposition/slice";
import type { Disposition, DispositionCreateRequest } from "@/features/emergency/disposition/types";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function* fetchDispositionsSaga(action: PayloadAction<string>) {
  try {
    const items: Disposition[] = yield call(getDispositions, action.payload);
    yield put(fetchDispositionsSuccess({ receptionNo: action.payload, items }));
  } catch (err) {
    // 퇴실 결정 조회에 실패했습니다.
    yield put(fetchDispositionsFailure(errorMessage(err, "Failed to load disposition.")));
  }
}

function* createDispositionSaga(action: PayloadAction<DispositionCreateRequest>) {
  try {
    const disposition: Disposition = yield call(createDisposition, action.payload);
    yield put(createDispositionSuccess(disposition));
  } catch (err) {
    // 퇴실 결정 등록에 실패했습니다.
    yield put(createDispositionFailure(errorMessage(err, "Failed to register disposition.")));
  }
}

export default function* dispositionSaga() {
  yield takeLatest(fetchDispositionsRequest.type, fetchDispositionsSaga);
  yield takeLatest(createDispositionRequest.type, createDispositionSaga);
}
