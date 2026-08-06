import { all, call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import type {
  AdmissionDTO,
  RegisterAdmissionRequest,
  UpdateAdmissionRequest,
} from "./types";
import {
  createAdmissionApi,
  deleteAdmissionApi,
  fetchAdmissionApi,
  fetchAdmissionDetailApi,
  updateAdmissionApi,
  changeAdmissionStatusApi, 
} from "./api";
import { changeStatusFailure, changeStatusSuccess, fetchAdmissionsFailure } from "./slice";

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "알 수 없는 오류가 발생했습니다.";
}

function  *fetchAdmissionsSaga() {
  try {
    const admissions: AdmissionDTO[] = yield call(fetchAdmissionApi);
    yield put({ type: "admission/fetchAdmissionsSuccess", payload: admissions ?? [] });
    } catch (e:unknown) {
        yield put(fetchAdmissionsFailure(extractErrorMessage(e)));
    }
}

function* fetchAdmissionDetailSaga(action: PayloadAction<string>) {
  try {
    const admission: AdmissionDTO = yield call(fetchAdmissionDetailApi, action.payload);
    yield put({ type: "admission/fetchAdmissionDetailSuccess", payload: admission });
  } catch (e: unknown) {
    yield put({ type: "admission/fetchAdmissionDetailFailure", payload: extractErrorMessage(e) });
  }
}

function* createAdmissionSaga(action: PayloadAction<RegisterAdmissionRequest>) {
  try {
    const admission: AdmissionDTO = yield call(createAdmissionApi, action.payload);
    yield put({ type: "admission/createAdmissionSuccess", payload: admission });
  } catch (e: unknown) {
    yield put({ type: "admission/createAdmissionFailure", payload: extractErrorMessage(e) });
  }
}

function* updateAdmissionSaga(action: PayloadAction<UpdateAdmissionRequest>) {
  try {
    const admission: AdmissionDTO = yield call(updateAdmissionApi, action.payload);
    yield put({ type: "admission/updateAdmissionSuccess", payload: admission });
  } catch (e: unknown) {
    yield put({ type: "admission/updateAdmissionFailure", payload: extractErrorMessage(e) });
  }
}

function* deleteAdmissionSaga(action: PayloadAction<string>) {
  try {
    yield call(deleteAdmissionApi, action.payload);
    yield put({ type: "admission/deleteAdmissionSuccess", payload: action.payload });
  } catch (e: unknown) {
    yield put({ type: "admission/deleteAdmissionFailure", payload: extractErrorMessage(e) });
  }
}
function* changeStatusSaga(action: PayloadAction<{ admissionId: string; status: string }>) {
  try {
    const admission: AdmissionDTO = yield call(
      changeAdmissionStatusApi,
      action.payload.admissionId,
      action.payload.status
    );
    yield put(changeStatusSuccess(admission));
  } catch (e: unknown) {
    yield put(changeStatusFailure(extractErrorMessage(e)));
  }
}
export default function* admissionSaga() {
  yield all([
    takeLatest("admission/fetchAdmissionsRequest", fetchAdmissionsSaga),
    takeLatest("admission/fetchAdmissionDetailRequest", fetchAdmissionDetailSaga),
    takeLatest("admission/createAdmissionRequest", createAdmissionSaga),
    takeLatest("admission/updateAdmissionRequest", updateAdmissionSaga),
    takeLatest("admission/deleteAdmissionRequest", deleteAdmissionSaga),
    takeLatest("admission/changeStatusRequest", changeStatusSaga),
  ]);
}