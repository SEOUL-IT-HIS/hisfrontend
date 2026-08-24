import { all, call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import { BedReservationDTO, RegisterBedReservationRequest, UpdateBedReservationRequest } from "../types";
import { createBedReservationApi, deleteBedReservationApi, fetchBedReservationApi, fetchBedReservationDetailApi, updateBedReservationApi, updateBedReservationScheduleApi } from "./api";
import { fetchBedReservationsFailure } from "./slice";


function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "알 수 없는 오류가 발생했습니다.";
}

function  *fetchBedReservationsSaga() {
  try {
    const bedReservations: BedReservationDTO[] = yield call(fetchBedReservationApi);
    yield put({ type: "bedReservation/fetchBedReservationsSuccess", payload: bedReservations ?? [] });
    } catch (e:unknown) {
        yield put(fetchBedReservationsFailure(extractErrorMessage(e)));
    }
}

function* fetchBedReservationDetailSaga(action: PayloadAction<string>) {
  try {
    const bedReservation: BedReservationDTO = yield call(fetchBedReservationDetailApi, action.payload);
    yield put({ type: "bedReservation/fetchBedReservationDetailSuccess", payload: bedReservation });
  } catch (e: unknown) {
    yield put({ type: "bedReservation/fetchBedReservationDetailFailure", payload: extractErrorMessage(e) });
  }
}

function* createBedReservationSaga(action: PayloadAction<RegisterBedReservationRequest>) {
  try {
    const bedReservation: BedReservationDTO = yield call(createBedReservationApi, action.payload);
    yield put({ type: "bedReservation/createBedReservationSuccess", payload: bedReservation });
  } catch (e: unknown) {
    yield put({ type: "bedReservation/createBedReservationFailure", payload: extractErrorMessage(e) });
  }
}

function* updateBedReservationSaga(action: PayloadAction<UpdateBedReservationRequest>) {
  try {
    const bedReservation: BedReservationDTO = yield call(updateBedReservationApi, action.payload);
    yield put({ type: "bedReservation/updateBedReservationSuccess", payload: bedReservation });
  } catch (e: unknown) {
    yield put({ type: "bedReservation/updateBedReservationFailure", payload: extractErrorMessage(e) });
  }
}
function* updateBedReservationScheduleSaga(action: PayloadAction<{ id: string; reserveAt: string; expectedAdmissionAt: string }>) {
  try {
    const { id, reserveAt, expectedAdmissionAt } = action.payload;
    const bedReservation: BedReservationDTO = yield call(updateBedReservationScheduleApi, id, { reserveAt, expectedAdmissionAt });
    yield put({ type: "bedReservation/updateBedReservationScheduleSuccess", payload: bedReservation });
  } catch (e: unknown) {
    yield put({ type: "bedReservation/updateBedReservationScheduleFailure", payload: extractErrorMessage(e) });
  }
}

function* deleteBedReservationSaga(action: PayloadAction<string>) {
  try {
    yield call(deleteBedReservationApi, action.payload);
    yield put({ type: "bedReservation/deleteBedReservationSuccess", payload: action.payload });
  } catch (e: unknown) {
    yield put({ type: "bedReservation/deleteBedReservationFailure", payload: extractErrorMessage(e) });
  }
}
export default function* bedReservationSaga() {
  yield all([
    takeLatest("bedReservation/fetchBedReservationsRequest", fetchBedReservationsSaga),
    takeLatest("bedReservation/fetchBedReservationDetailRequest", fetchBedReservationDetailSaga),
    takeLatest("bedReservation/createBedReservationRequest", createBedReservationSaga),
    takeLatest("bedReservation/updateBedReservationRequest", updateBedReservationSaga),
    takeLatest("bedReservation/updateBedReservationScheduleRequest", updateBedReservationScheduleSaga),
    takeLatest("bedReservation/deleteBedReservationRequest", deleteBedReservationSaga),
  ]);
}