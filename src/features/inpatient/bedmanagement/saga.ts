import { all, call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import type {
  BedAssignmentDTO,
  RegisterBedAssignmentRequest,
  UpdateBedAssignmentRequest,
} from "./types";
import {
  createBedAssignmentApi,
  deleteBedAssignmentApi,
  fetchBedAssignmentApi,
  fetchBedAssignmentDetailApi,
  updateBedAssignmentApi,
} from "./api";
import { fetchBedAssignmentsFailure } from "./slice";

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "알 수 없는 오류가 발생했습니다.";
}

function  *fetchBedAssignmentsSaga() {
  try {
    const bedAssignments: BedAssignmentDTO[] = yield call(fetchBedAssignmentApi);
    yield put({ type: "bedAssignment/fetchBedAssignmentsSuccess", payload: bedAssignments ?? [] });
    } catch (e:unknown) {
        yield put(fetchBedAssignmentsFailure(extractErrorMessage(e)));
    }
}

function* fetchBedAssignmentDetailSaga(action: PayloadAction<string>) {
  try {
    const bedAssignment: BedAssignmentDTO = yield call(fetchBedAssignmentDetailApi, action.payload);
    yield put({ type: "bedAssignment/fetchBedAssignmentDetailSuccess", payload: bedAssignment });
  } catch (e: unknown) {
    yield put({ type: "bedAssignment/fetchBedAssignmentDetailFailure", payload: extractErrorMessage(e) });
  }
}

function* createBedAssignmentSaga(action: PayloadAction<RegisterBedAssignmentRequest>) {
  try {
    const bedAssignment: BedAssignmentDTO = yield call(createBedAssignmentApi, action.payload);
    yield put({ type: "bedAssignment/createBedAssignmentSuccess", payload: bedAssignment });
  } catch (e: unknown) {
    yield put({ type: "bedAssignment/createBedAssignmentFailure", payload: extractErrorMessage(e) });
  }
}

function* updateBedAssignmentSaga(action: PayloadAction<UpdateBedAssignmentRequest>) {
  try {
    const bedAssignment: BedAssignmentDTO = yield call(updateBedAssignmentApi, action.payload);
    yield put({ type: "bedAssignment/updateBedAssignmentSuccess", payload: bedAssignment });
  } catch (e: unknown) {
    yield put({ type: "bedAssignment/updateBedAssignmentFailure", payload: extractErrorMessage(e) });
  }
}

function* deleteBedAssignmentSaga(action: PayloadAction<string>) {
  try {
    yield call(deleteBedAssignmentApi, action.payload);
    yield put({ type: "bedAssignment/deleteBedAssignmentSuccess", payload: action.payload });
  } catch (e: unknown) {
    yield put({ type: "bedAssignment/deleteBedAssignmentFailure", payload: extractErrorMessage(e) });
  }
}
export default function* bedAssignmentSaga() {
  yield all([
    takeLatest("bedAssignment/fetchBedAssignmentsRequest", fetchBedAssignmentsSaga),
    takeLatest("bedAssignment/fetchBedAssignmentDetailRequest", fetchBedAssignmentDetailSaga),
    takeLatest("bedAssignment/createBedAssignmentRequest", createBedAssignmentSaga),
    takeLatest("bedAssignment/updateBedAssignmentRequest", updateBedAssignmentSaga),
    takeLatest("bedAssignment/deleteBedAssignmentRequest", deleteBedAssignmentSaga),
  ]);
}