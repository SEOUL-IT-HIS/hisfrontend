import { all, call, put, takeLatest } from "redux-saga/effects";
import { fetchBedApi, fetchBedDetailApi } from "./bedApi";
import { fetchBedFailure } from "./bedSlice";
import { BedDTO } from "./types";
import { PayloadAction } from "@reduxjs/toolkit";

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "알 수 없는 오류가 발생했습니다.";
}

function* fetchBedSaga() {
  try {
    const beds: BedDTO[] = yield call(fetchBedApi);
    yield put({ type: "bed/fetchBedSuccess", payload: beds ?? [] });
  } catch (e: unknown) {
    yield put(fetchBedFailure(extractErrorMessage(e)));
  }
}

function* fetchBedDetailSaga(action: PayloadAction<string>) {
  try {
    const bed: BedDTO = yield call(fetchBedDetailApi, action.payload);
    yield put({ type: "bed/fetchBedDetailSuccess", payload: bed });
  } catch (e: unknown) {
    yield put({ type: "bed/fetchBedDetailFailure", payload: extractErrorMessage(e) });
  }
}

export default function* bedSaga() {
  yield all([
    takeLatest("bed/fetchBedRequest", fetchBedSaga),
    takeLatest("bed/fetchBedDetailRequest", fetchBedDetailSaga),
  ]);
}
