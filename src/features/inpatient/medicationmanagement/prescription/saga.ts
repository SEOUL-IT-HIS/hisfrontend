import { all, call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { PrescriptionDTO, PrescriptionCreateDTO } from "../types";
import { createPrescriptionApi, fetchPrescriptionDetailApi, fetchPrescriptionsByAdmissionApi } from "./api";

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "알 수 없는 오류가 발생했습니다.";
}

function* fetchPrescriptionsSaga(action: PayloadAction<string>) {
  try {
    const prescriptions: PrescriptionDTO[] = yield call(fetchPrescriptionsByAdmissionApi, action.payload);
    yield put({ type: "prescription/fetchPrescriptionsSuccess", payload: prescriptions ?? [] });
  } catch (e: unknown) {
    yield put({ type: "prescription/fetchPrescriptionsFailure", payload: extractErrorMessage(e) });
  }
}

function* fetchPrescriptionDetailSaga(action: PayloadAction<string>) {
  try {
    const prescription: PrescriptionDTO = yield call(fetchPrescriptionDetailApi, action.payload);
    yield put({ type: "prescription/fetchPrescriptionDetailSuccess", payload: prescription });
  } catch (e: unknown) {
    yield put({ type: "prescription/fetchPrescriptionDetailFailure", payload: extractErrorMessage(e) });
  }
}

function* createPrescriptionSaga(action: PayloadAction<{ admissionId: string; request: PrescriptionCreateDTO }>) {
  try {
    const { admissionId, request } = action.payload;
    const prescription: PrescriptionDTO = yield call(createPrescriptionApi, admissionId, request);
    yield put({ type: "prescription/createPrescriptionSuccess", payload: prescription });
  } catch (e: unknown) {
    yield put({ type: "prescription/createPrescriptionFailure", payload: extractErrorMessage(e) });
  }
}

export default function* prescriptionSaga() {
  yield all([
    takeLatest("prescription/fetchPrescriptionsRequest", fetchPrescriptionsSaga),
    takeLatest("prescription/fetchPrescriptionDetailRequest", fetchPrescriptionDetailSaga),
    takeLatest("prescription/createPrescriptionRequest", createPrescriptionSaga),
  ]);
}
