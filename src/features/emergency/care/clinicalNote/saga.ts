import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createClinicalNote, getClinicalNotes } from "@/features/emergency/care/clinicalNote/api";
import {
  clinicalNoteSubmitFailure,
  clinicalNoteSubmitSuccess,
  createClinicalNoteRequest,
  fetchClinicalNotesFailure,
  fetchClinicalNotesRequest,
  fetchClinicalNotesSuccess,
} from "@/features/emergency/care/clinicalNote/slice";
import type { ClinicalNote, ClinicalNoteCreateRequest } from "@/features/emergency/care/clinicalNote/types";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function* fetchClinicalNotesSaga(action: PayloadAction<string>) {
  try {
    const items: ClinicalNote[] = yield call(getClinicalNotes, action.payload);
    yield put(fetchClinicalNotesSuccess(items));
  } catch (err) {
    yield put(fetchClinicalNotesFailure(errorMessage(err, "Failed to load clinical notes.")));
  }
}

function* createClinicalNoteSaga(action: PayloadAction<ClinicalNoteCreateRequest>) {
  try {
    const item: ClinicalNote = yield call(createClinicalNote, action.payload);
    yield put(clinicalNoteSubmitSuccess(item));
  } catch (err) {
    yield put(clinicalNoteSubmitFailure(errorMessage(err, "Failed to register clinical note.")));
  }
}

export default function* clinicalNoteSaga() {
  yield takeLatest(fetchClinicalNotesRequest.type, fetchClinicalNotesSaga);
  yield takeLatest(createClinicalNoteRequest.type, createClinicalNoteSaga);
}
