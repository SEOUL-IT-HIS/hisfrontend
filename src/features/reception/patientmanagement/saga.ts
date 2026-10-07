import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import { searchPatients } from "./api";
import {
  searchPatientsRequest,
  searchPatientsSuccess,
  searchPatientsFailure,
} from "./slice";
import type { PatientSearchItem, PatientSearchQuery } from "./types";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function* searchPatientsSaga(action: PayloadAction<PatientSearchQuery>) {
  try {
    const items: PatientSearchItem[] = yield call(
      searchPatients,
      action.payload,
    );
    yield put(searchPatientsSuccess(items));
  } catch (err) {
    yield put(
      searchPatientsFailure(errorMessage(err, "Failed to search patients.")),
    );
  }
}

export default function* patientManagementSaga() {
  yield takeLatest(searchPatientsRequest.type, searchPatientsSaga);
}
