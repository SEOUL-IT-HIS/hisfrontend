import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createConsent, getConsents } from "@/features/emergency/care/consent/api";
import {
  createConsentFailure,
  createConsentRequest,
  createConsentSuccess,
  fetchConsentsFailure,
  fetchConsentsRequest,
  fetchConsentsSuccess,
} from "@/features/emergency/care/consent/slice";
import type { ConsentRecord, ConsentRecordCreateRequest } from "@/features/emergency/care/consent/types";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function* fetchConsentsSaga(action: PayloadAction<string>) {
  try {
    const items: ConsentRecord[] = yield call(getConsents, action.payload);
    yield put(fetchConsentsSuccess(items));
  } catch (err) {
    // 동의 기록 조회에 실패했습니다.
    yield put(fetchConsentsFailure(errorMessage(err, "Failed to load consent records.")));
  }
}

function* createConsentSaga(action: PayloadAction<ConsentRecordCreateRequest>) {
  try {
    const item: ConsentRecord = yield call(createConsent, action.payload);
    yield put(createConsentSuccess(item));
  } catch (err) {
    // 동의 기록 등록에 실패했습니다.
    yield put(createConsentFailure(errorMessage(err, "Failed to register consent record.")));
  }
}

export default function* consentSaga() {
  yield takeLatest(fetchConsentsRequest.type, fetchConsentsSaga);
  yield takeLatest(createConsentRequest.type, createConsentSaga);
}
