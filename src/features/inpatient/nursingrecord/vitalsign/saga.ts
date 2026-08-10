import { all, call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import { VitalSignDTO, RegisterVitalSignRequest, UpdateVitalSignRequest } from "../types";
import { createVitalSignApi,  deleteVitalSignApi,fetchVitalSignApi, fetchVitalSignDetailApi, updateVitalSignApi, updateVitalSignScheduleApi } from "./api";



function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "알 수 없는 오류가 발생했습니다.";
}

function  *fetchVitalSignsSaga() {
  try {
    const vitalSigns: VitalSignDTO[] = yield call(fetchVitalSignApi);
    yield put({ type: "vitalSign/fetchVitalSignsSuccess", payload: vitalSigns ?? [] });
    } catch (e:unknown) {
        yield put({ type: "vitalSign/fetchVitalSignsFailure", payload: extractErrorMessage(e) });
    }
}

function* fetchVitalSignDetailSaga(action: PayloadAction<string>) {
  try {
    const vitalSign: VitalSignDTO = yield call(fetchVitalSignDetailApi, action.payload);
    yield put({ type: "vitalSign/fetchVitalSignDetailSuccess", payload: vitalSign });
  } catch (e: unknown) {
    yield put({ type: "vitalSign/fetchVitalSignDetailFailure", payload: extractErrorMessage(e) });
  }
}

function* createVitalSignSaga(action: PayloadAction<RegisterVitalSignRequest>) {
  try {
    const vitalSign: VitalSignDTO = yield call(createVitalSignApi, action.payload);
    yield put({ type: "vitalSign/createVitalSignSuccess", payload: vitalSign });
  } catch (e: unknown) {
    yield put({ type: "vitalSign/createVitalSignFailure", payload: extractErrorMessage(e) });
  }
}

function* updateVitalSignSaga(action: PayloadAction<UpdateVitalSignRequest>) {
  try {
    const vitalSign: VitalSignDTO = yield call(updateVitalSignApi, action.payload);
    yield put({ type: "vitalSign/updateVitalSignSuccess", payload: vitalSign });
  } catch (e: unknown) {
    yield put({ type: "vitalSign/updateVitalSignFailure", payload: extractErrorMessage(e) });
  }
}
function* updateVitalSignScheduleSaga(action: PayloadAction<{ id: string; reserveAt: string; expectedAdmissionAt: string }>) {
  try {
    const { id, reserveAt, expectedAdmissionAt } = action.payload;
    const vitalSign: VitalSignDTO = yield call(updateVitalSignScheduleApi, id, { reserveAt, expectedAdmissionAt });
    yield put({ type: "vitalSign/updateVitalSignScheduleSuccess", payload: vitalSign });
  } catch (e: unknown) {
    yield put({ type: "vitalSign/updateVitalSignScheduleFailure", payload: extractErrorMessage(e) });
  }
}

function* deleteVitalSignSaga(action: PayloadAction<string>) {
  try {
    yield call(deleteVitalSignApi, action.payload);
    yield put({ type: "vitalSign/deleteVitalSignSuccess", payload: action.payload });
  } catch (e: unknown) {
    yield put({ type: "vitalSign/deleteVitalSignFailure", payload: extractErrorMessage(e) });
  }
}
export default function* vitalSignSaga() {
  yield all([
    takeLatest("vitalSign/fetchVitalSignsRequest", fetchVitalSignsSaga),
    takeLatest("vitalSign/fetchVitalSignDetailRequest", fetchVitalSignDetailSaga),
    takeLatest("vitalSign/createVitalSignRequest", createVitalSignSaga),
    takeLatest("vitalSign/updateVitalSignRequest", updateVitalSignSaga),
    takeLatest("vitalSign/updateVitalSignScheduleRequest", updateVitalSignScheduleSaga),
    takeLatest("vitalSign/deleteVitalSignRequest", deleteVitalSignSaga),
  ]);
}