import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createVitalAssessments, getVitalAssessments } from "@/features/emergency/vitals/api";
import {
  createVitalsFailure,
  createVitalsRequest,
  createVitalsSuccess,
  fetchVitalsFailure,
  fetchVitalsRequest,
  fetchVitalsSuccess,
} from "@/features/emergency/vitals/slice";
import type { EwsRecord, VitalAssessmentCreateRequest } from "@/features/emergency/vitals/types";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function* fetchVitalsSaga(action: PayloadAction<string>) {
  try {
    const items: EwsRecord[] = yield call(getVitalAssessments, action.payload);
    yield put(fetchVitalsSuccess(items));
  } catch (err) {
    yield put(fetchVitalsFailure(errorMessage(err, "활력징후 조회에 실패했습니다.")));
  }
}

function* createVitalsSaga(action: PayloadAction<VitalAssessmentCreateRequest>) {
  try {
    const items: EwsRecord[] = yield call(createVitalAssessments, action.payload);
    yield put(createVitalsSuccess(items));
  } catch (err) {
    yield put(createVitalsFailure(errorMessage(err, "활력징후 등록에 실패했습니다.")));
  }
}

export default function* vitalsSaga() {
  yield takeLatest(fetchVitalsRequest.type, fetchVitalsSaga);
  yield takeLatest(createVitalsRequest.type, createVitalsSaga);
}
