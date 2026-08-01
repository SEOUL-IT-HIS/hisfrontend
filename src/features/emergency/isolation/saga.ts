import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createIsolation, getIsolations, releaseIsolation } from "@/features/emergency/isolation/api";
import {
  createIsolationRequest,
  fetchIsolationsFailure,
  fetchIsolationsRequest,
  fetchIsolationsSuccess,
  isolationSubmitFailure,
  isolationSubmitSuccess,
  releaseIsolationRequest,
} from "@/features/emergency/isolation/slice";
import type { IsolationAssessment, IsolationCreateRequest } from "@/features/emergency/isolation/types";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function* fetchIsolationsSaga(action: PayloadAction<string>) {
  try {
    const items: IsolationAssessment[] = yield call(getIsolations, action.payload);
    yield put(fetchIsolationsSuccess(items));
  } catch (err) {
    yield put(fetchIsolationsFailure(errorMessage(err, "격리 이력 조회에 실패했습니다.")));
  }
}

function* createIsolationSaga(action: PayloadAction<IsolationCreateRequest>) {
  try {
    const item: IsolationAssessment = yield call(createIsolation, action.payload);
    yield put(isolationSubmitSuccess(item));
  } catch (err) {
    yield put(isolationSubmitFailure(errorMessage(err, "격리 등록에 실패했습니다.")));
  }
}

function* releaseIsolationSaga(action: PayloadAction<string>) {
  try {
    const item: IsolationAssessment = yield call(releaseIsolation, action.payload);
    yield put(isolationSubmitSuccess(item));
  } catch (err) {
    yield put(isolationSubmitFailure(errorMessage(err, "격리 해제에 실패했습니다.")));
  }
}

export default function* isolationSaga() {
  yield takeLatest(fetchIsolationsRequest.type, fetchIsolationsSaga);
  yield takeLatest(createIsolationRequest.type, createIsolationSaga);
  yield takeLatest(releaseIsolationRequest.type, releaseIsolationSaga);
}
