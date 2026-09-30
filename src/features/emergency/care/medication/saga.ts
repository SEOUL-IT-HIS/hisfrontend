import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  createMedicationAdministration,
  getMedicationAdministrations,
} from "@/features/emergency/care/medication/api";
import {
  createMedicationFailure,
  createMedicationRequest,
  createMedicationSuccess,
  fetchMedicationsFailure,
  fetchMedicationsRequest,
  fetchMedicationsSuccess,
} from "@/features/emergency/care/medication/slice";
import type {
  MedicationAdministration,
  MedicationCreateRequest,
} from "@/features/emergency/care/medication/types";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function* fetchMedicationsSaga(action: PayloadAction<string>) {
  try {
    const items: MedicationAdministration[] = yield call(getMedicationAdministrations, action.payload);
    yield put(fetchMedicationsSuccess(items));
  } catch (err) {
    // 투여 기록 조회에 실패했습니다.
    yield put(fetchMedicationsFailure(errorMessage(err, "Failed to load medication records.")));
  }
}

function* createMedicationSaga(action: PayloadAction<MedicationCreateRequest>) {
  try {
    const item: MedicationAdministration = yield call(createMedicationAdministration, action.payload);
    yield put(createMedicationSuccess(item));
  } catch (err) {
    // 투여 기록 등록에 실패했습니다.
    yield put(createMedicationFailure(errorMessage(err, "Failed to register medication record.")));
  }
}

export default function* medicationSaga() {
  yield takeLatest(fetchMedicationsRequest.type, fetchMedicationsSaga);
  yield takeLatest(createMedicationRequest.type, createMedicationSaga);
}
