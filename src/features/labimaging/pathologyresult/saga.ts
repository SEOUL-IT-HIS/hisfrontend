import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  confirmPathologyResult,
  createPathologyResult,
  fetchPathologyResults,
  updatePathologyResult,
} from "@/features/labimaging/pathologyresult/api";
import {
  fetchPathologyResultsRequest,
  fetchPathologyResultsSuccess,
  fetchPathologyResultsFailure,
  createPathologyResultRequest,
  updatePathologyResultRequest,
  confirmPathologyResultRequest,
  submitPathologyResultSuccess,
  submitPathologyResultFailure,
} from "@/features/labimaging/pathologyresult/slice";
import type {
  PathologyResultCreateRequest,
  PathologyResultSummary,
  PathologyResultUpdateRequest,
} from "@/features/labimaging/pathologyresult/types";
import type { LabResultConfirmRequest } from "@/features/labimaging/labresult/types";

/** 병리검사결과 saga — UC-RST-03 (5차 Phase 4) */
function* fetchSaga(action: PayloadAction<string>) {
  try {
    const results: PathologyResultSummary[] = yield call(fetchPathologyResults, action.payload);
    yield put(fetchPathologyResultsSuccess(results));
  } catch (err) {
    yield put(fetchPathologyResultsFailure(err instanceof Error ? err.message : "Failed to load pathology results."));
  }
}

function* createSaga(
  action: PayloadAction<{ request: PathologyResultCreateRequest; file: File | null; receptionNo: string }>,
) {
  const { request, file, receptionNo } = action.payload;
  try {
    const saved: PathologyResultSummary = yield call(createPathologyResult, request, file);
    yield put(submitPathologyResultSuccess(saved));
    yield put(fetchPathologyResultsRequest(receptionNo));
  } catch (err) {
    yield put(submitPathologyResultFailure(err instanceof Error ? err.message : "Failed to register pathology result."));
  }
}

function* updateSaga(
  action: PayloadAction<{
    pathologyResultId: string;
    request: PathologyResultUpdateRequest;
    file: File | null;
    receptionNo: string;
  }>,
) {
  const { pathologyResultId, request, file, receptionNo } = action.payload;
  try {
    const saved: PathologyResultSummary = yield call(updatePathologyResult, pathologyResultId, request, file);
    yield put(submitPathologyResultSuccess(saved));
    yield put(fetchPathologyResultsRequest(receptionNo));
  } catch (err) {
    yield put(submitPathologyResultFailure(err instanceof Error ? err.message : "Failed to update pathology result."));
  }
}

function* confirmSaga(
  action: PayloadAction<{ pathologyResultId: string; request: LabResultConfirmRequest; receptionNo: string }>,
) {
  const { pathologyResultId, request, receptionNo } = action.payload;
  try {
    const saved: PathologyResultSummary = yield call(confirmPathologyResult, pathologyResultId, request);
    yield put(submitPathologyResultSuccess(saved));
    yield put(fetchPathologyResultsRequest(receptionNo));
  } catch (err) {
    yield put(submitPathologyResultFailure(err instanceof Error ? err.message : "Failed to confirm pathology result."));
  }
}

export default function* pathologyResultSaga() {
  yield takeLatest(fetchPathologyResultsRequest.type, fetchSaga);
  yield takeLatest(createPathologyResultRequest.type, createSaga);
  yield takeLatest(updatePathologyResultRequest.type, updateSaga);
  yield takeLatest(confirmPathologyResultRequest.type, confirmSaga);
}
