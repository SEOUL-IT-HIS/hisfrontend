import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  createConsent,
  getConsents,
  getConsentsByPatient,
} from "@/features/surgery/consent/api";
import {
  consentMutationFailure,
  consentMutationSuccess,
  createConsentRequest,
  fetchConsentsFailure,
  fetchConsentsRequest,
  fetchConsentsSuccess,
  fetchPatientConsentsFailure,
  fetchPatientConsentsRequest,
  fetchPatientConsentsSuccess,
} from "@/features/surgery/consent/slice";
import type {
  Consent,
  CreateConsentRequest,
} from "@/features/surgery/consent/types";

/**
 * 수술 동의서 saga (SL2-42)
 *
 * <p>API 호출은 여기서만 한다(§10.3). 실패 시 Error.message(SUR### 코드 또는 문구)를
 * 그대로 전달하고 문구 변환은 컴포넌트에서 처리한다(§15.1).</p>
 */

function* fetchConsentsSaga(action: PayloadAction<string>) {
  try {
    const response: Consent[] = yield call(getConsents, action.payload);
    yield put(fetchConsentsSuccess(response));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "동의서 조회에 실패했습니다.";
    yield put(fetchConsentsFailure(message));
  }
}

function* fetchPatientConsentsSaga(action: PayloadAction<string>) {
  try {
    const response: Consent[] = yield call(getConsentsByPatient, action.payload);
    yield put(fetchPatientConsentsSuccess(response));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "동의서 이력 조회에 실패했습니다.";
    yield put(fetchPatientConsentsFailure(message));
  }
}

function* createConsentSaga(
  action: PayloadAction<{ surgeryId: string; request: CreateConsentRequest }>,
) {
  try {
    const { surgeryId, request } = action.payload;
    yield call(createConsent, surgeryId, request);
    yield put(consentMutationSuccess());
    // 등록 직후 해당 수술의 목록을 다시 읽어 방금 남긴 동의를 반영한다
    yield put(fetchConsentsRequest(surgeryId));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "동의 확인 기록에 실패했습니다.";
    yield put(consentMutationFailure(message));
  }
}

/** 동의서 관련 요청을 감시한다(최신 요청만 처리) */
export default function* consentSaga() {
  yield takeLatest(fetchConsentsRequest.type, fetchConsentsSaga);
  yield takeLatest(fetchPatientConsentsRequest.type, fetchPatientConsentsSaga);
  yield takeLatest(createConsentRequest.type, createConsentSaga);
}
