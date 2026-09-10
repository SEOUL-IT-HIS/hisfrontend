import { all, call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import { IandORecordDTO, RegisterIandORecordRequest, UpdateIandORecordRequest } from "../types";
import { createIandORecordApi, deleteIandORecordApi, fetchIandORecordApi, fetchIandORecordDetailApi, updateIandORecordApi } from "./api";



function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "알 수 없는 오류가 발생했습니다.";
}

function  *fetchIandORecordSaga() {
  try {
    const iandorecords: IandORecordDTO[] = yield call(fetchIandORecordApi);
    yield put({ type: "iandorecord/fetchIandORecordsSuccess", payload: iandorecords ?? [] });
    } catch (e:unknown) {
        yield put({ type: "iandorecord/fetchIandORecordsFailure", payload: extractErrorMessage(e) });
    }
}

function* fetchIandORecordDetailSaga(action: PayloadAction<string>) {
  try {
    const iandorecord: IandORecordDTO = yield call(fetchIandORecordDetailApi, action.payload);
    yield put({ type: "iandorecord/fetchIandORecordDetailSuccess", payload: iandorecord });
  } catch (e: unknown) {
    yield put({ type: "iandorecord/fetchIandORecordDetailFailure", payload: extractErrorMessage(e) });
  }
}

function* createIandORecordSaga(action: PayloadAction<RegisterIandORecordRequest>) {
  try {
    const iandorecord: IandORecordDTO = yield call(createIandORecordApi, action.payload);
    yield put({ type: "iandorecord/createIandORecordSuccess", payload: iandorecord });
  } catch (e: unknown) {
    yield put({ type: "iandorecord/createIandORecordFailure", payload: extractErrorMessage(e) });
  }
}

function* updateIandORecordSaga(action: PayloadAction<UpdateIandORecordRequest>) {
  try {
    const iandorecord: IandORecordDTO = yield call(updateIandORecordApi, action.payload);
    yield put({ type: "iandorecord/updateIandORecordSuccess", payload: iandorecord });
  } catch (e: unknown) {
    yield put({ type: "iandorecord/updateIandORecordFailure", payload: extractErrorMessage(e) });
  }
}
function* deleteIandORecordSaga(action: PayloadAction<string>) {
  try {
    yield call(deleteIandORecordApi, action.payload);
    yield put({ type: "iandorecord/deleteIandORecordSuccess", payload: action.payload });
  } catch (e: unknown) {
    yield put({ type: "iandorecord/deleteIandORecordFailure", payload: extractErrorMessage(e) });
  }
}


export default function* iandorecordSaga() {
  yield all([
    takeLatest("iandorecord/fetchIandORecordsRequest", fetchIandORecordSaga),
    takeLatest("iandorecord/fetchIandORecordDetailRequest", fetchIandORecordDetailSaga),
    takeLatest("iandorecord/createIandORecordRequest", createIandORecordSaga),
    takeLatest("iandorecord/updateIandORecordRequest", updateIandORecordSaga),
    takeLatest("iandorecord/deleteIandORecordRequest", deleteIandORecordSaga),
  ]);
}