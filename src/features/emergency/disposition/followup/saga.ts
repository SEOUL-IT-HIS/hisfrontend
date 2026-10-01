import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  createAdmissionRequest,
  createTransferNote,
  getAdmissionRequests,
  getTransferNotes,
} from "@/features/emergency/disposition/followup/api";
import {
  createAdmissionRequestAction,
  createAdmissionSuccess,
  createTransferNoteAction,
  createTransferSuccess,
  fetchAdmissionsRequest,
  fetchAdmissionsSuccess,
  fetchTransfersRequest,
  fetchTransfersSuccess,
  followUpFetchFailure,
  followUpSubmitFailure,
} from "@/features/emergency/disposition/followup/slice";
import type {
  AdmissionCreateRequest,
  AdmissionRequest,
  TransferNote,
  TransferNoteCreateRequest,
} from "@/features/emergency/disposition/followup/types";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function* fetchAdmissionsSaga(action: PayloadAction<string>) {
  try {
    const items: AdmissionRequest[] = yield call(getAdmissionRequests, action.payload);
    yield put(fetchAdmissionsSuccess({ dispositionId: action.payload, items }));
  } catch (err) {
    // 입원요청 조회에 실패했습니다.
    yield put(followUpFetchFailure(errorMessage(err, "Failed to load admission requests.")));
  }
}

function* createAdmissionSaga(action: PayloadAction<{ dispositionId: string; request: AdmissionCreateRequest }>) {
  try {
    const item: AdmissionRequest = yield call(
      createAdmissionRequest,
      action.payload.dispositionId,
      action.payload.request,
    );
    yield put(createAdmissionSuccess(item));
  } catch (err) {
    // 입원요청 등록에 실패했습니다.
    yield put(followUpSubmitFailure(errorMessage(err, "Failed to send admission request.")));
  }
}

function* fetchTransfersSaga(action: PayloadAction<string>) {
  try {
    const items: TransferNote[] = yield call(getTransferNotes, action.payload);
    yield put(fetchTransfersSuccess({ dispositionId: action.payload, items }));
  } catch (err) {
    // 전원 소견서 조회에 실패했습니다.
    yield put(followUpFetchFailure(errorMessage(err, "Failed to load transfer notes.")));
  }
}

function* createTransferSaga(action: PayloadAction<{ dispositionId: string; request: TransferNoteCreateRequest }>) {
  try {
    const item: TransferNote = yield call(createTransferNote, action.payload.dispositionId, action.payload.request);
    yield put(createTransferSuccess(item));
  } catch (err) {
    // 전원 소견서 작성에 실패했습니다.
    yield put(followUpSubmitFailure(errorMessage(err, "Failed to write transfer note.")));
  }
}

export default function* dispositionFollowUpSaga() {
  yield takeLatest(fetchAdmissionsRequest.type, fetchAdmissionsSaga);
  yield takeLatest(createAdmissionRequestAction.type, createAdmissionSaga);
  yield takeLatest(fetchTransfersRequest.type, fetchTransfersSaga);
  yield takeLatest(createTransferNoteAction.type, createTransferSaga);
}
