import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import { assignBed, getBeds, releaseBed } from "@/features/emergency/resource/bed/api";
import {
  assignBedFailure,
  assignBedRequest,
  assignBedSuccess,
  fetchBedsFailure,
  fetchBedsRequest,
  fetchBedsSuccess,
  releaseBedFailure,
  releaseBedRequest,
  releaseBedSuccess,
} from "@/features/emergency/resource/bed/slice";
import type {
  Bed,
  BedAssignment,
  BedAssignmentCreateRequest,
  BedReleaseRequest,
} from "@/features/emergency/resource/bed/types";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function* fetchBedsSaga() {
  try {
    const beds: Bed[] = yield call(getBeds);
    yield put(fetchBedsSuccess(beds));
  } catch (err) {
    // 병상 목록 조회에 실패했습니다.
    yield put(fetchBedsFailure(errorMessage(err, "Failed to load bed list.")));
  }
}

function* assignBedSaga(action: PayloadAction<BedAssignmentCreateRequest>) {
  try {
    const assignment: BedAssignment = yield call(assignBed, action.payload);
    yield put(assignBedSuccess(assignment));
    // 배정되면 그 병상 상태가 OCCUPIED로 바뀌므로 목록을 다시 불러온다.
    yield put(fetchBedsRequest());
  } catch (err) {
    // 병상 배정에 실패했습니다.
    yield put(assignBedFailure(errorMessage(err, "Failed to assign bed.")));
  }
}

function* releaseBedSaga(action: PayloadAction<{ assignmentId: string; request: BedReleaseRequest }>) {
  try {
    yield call(releaseBed, action.payload.assignmentId, action.payload.request);
    yield put(releaseBedSuccess());
    // 해제되면 그 병상 상태가 EMPTY로 바뀌므로 목록을 다시 불러온다.
    yield put(fetchBedsRequest());
  } catch (err) {
    // 병상 해제에 실패했습니다.
    yield put(releaseBedFailure(errorMessage(err, "Failed to release bed.")));
  }
}

export default function* bedSaga() {
  yield takeLatest(fetchBedsRequest.type, fetchBedsSaga);
  yield takeLatest(assignBedRequest.type, assignBedSaga);
  yield takeLatest(releaseBedRequest.type, releaseBedSaga);
}
