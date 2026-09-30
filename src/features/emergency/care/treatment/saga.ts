import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createTreatment, getTreatments } from "@/features/emergency/care/treatment/api";
import {
  createTreatmentFailure,
  createTreatmentRequest,
  createTreatmentSuccess,
  fetchTreatmentsFailure,
  fetchTreatmentsRequest,
  fetchTreatmentsSuccess,
} from "@/features/emergency/care/treatment/slice";
import type { TreatmentCreateRequest, TreatmentRecord } from "@/features/emergency/care/treatment/types";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function* fetchTreatmentsSaga(action: PayloadAction<string>) {
  try {
    const items: TreatmentRecord[] = yield call(getTreatments, action.payload);
    yield put(fetchTreatmentsSuccess(items));
  } catch (err) {
    // 처치 기록 조회에 실패했습니다.
    yield put(fetchTreatmentsFailure(errorMessage(err, "Failed to load treatment records.")));
  }
}

function* createTreatmentSaga(action: PayloadAction<TreatmentCreateRequest>) {
  try {
    const item: TreatmentRecord = yield call(createTreatment, action.payload);
    yield put(createTreatmentSuccess(item));
  } catch (err) {
    // 처치 기록 등록에 실패했습니다.
    yield put(createTreatmentFailure(errorMessage(err, "Failed to register treatment record.")));
  }
}

export default function* treatmentSaga() {
  yield takeLatest(fetchTreatmentsRequest.type, fetchTreatmentsSaga);
  yield takeLatest(createTreatmentRequest.type, createTreatmentSaga);
}
