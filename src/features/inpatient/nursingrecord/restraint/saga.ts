import { all, call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createRestraintApi, deleteRestraintApi, fetchRestraintApi, fetchRestraintDetailApi, updateRestraintApi } from "./api";
import { RestraintDTO, RegisterRestraintRequest, UpdateRestraintRequest } from "../types";



function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "알 수 없는 오류가 발생했습니다.";
}

function  *fetchRestraintSaga() {
  try {
    const restraints: RestraintDTO[] = yield call(fetchRestraintApi);
    yield put({ type: "restraint/fetchRestraintsSuccess", payload: restraints ?? [] });
    } catch (e:unknown) {
        yield put({ type: "restraint/fetchRestraintsFailure", payload: extractErrorMessage(e) });
    }
}

function* fetchRestraintDetailSaga(action: PayloadAction<string>) {
  try {
    const restraint: RestraintDTO = yield call(fetchRestraintDetailApi, action.payload);
    yield put({ type: "restraint/fetchRestraintDetailSuccess", payload: restraint });
  } catch (e: unknown) {
    yield put({ type: "restraint/fetchRestraintDetailFailure", payload: extractErrorMessage(e) });
  }
}

function* createRestraintSaga(action: PayloadAction<RegisterRestraintRequest>) {
  try {
    const restraint: RestraintDTO = yield call(createRestraintApi, action.payload);
    yield put({ type: "restraint/createRestraintSuccess", payload: restraint });
  } catch (e: unknown) {
    yield put({ type: "restraint/createRestraintFailure", payload: extractErrorMessage(e) });
  }
}

function* updateRestraintSaga(action: PayloadAction<UpdateRestraintRequest>) {
  try {
    const restraint: RestraintDTO = yield call(updateRestraintApi, action.payload);
    yield put({ type: "restraint/updateRestraintSuccess", payload: restraint });
  } catch (e: unknown) {
    yield put({ type: "restraint/updateRestraintFailure", payload: extractErrorMessage(e) });
  }
}
function* deleteRestraintSaga(action: PayloadAction<string>) {
  try {
    yield call(deleteRestraintApi, action.payload);
    yield put({ type: "restraint/deleteRestraintSuccess", payload: action.payload });
  } catch (e: unknown) {
    yield put({ type: "restraint/deleteRestraintFailure", payload: extractErrorMessage(e) });
  }
}


export default function* restraintSaga() {
  yield all([
    takeLatest("restraint/fetchRestraintsRequest", fetchRestraintSaga),
    takeLatest("restraint/fetchRestraintDetailRequest", fetchRestraintDetailSaga),
    takeLatest("restraint/createRestraintRequest", createRestraintSaga),
    takeLatest("restraint/updateRestraintRequest", updateRestraintSaga),
    takeLatest("restraint/deleteRestraintRequest", deleteRestraintSaga),
  ]);
}