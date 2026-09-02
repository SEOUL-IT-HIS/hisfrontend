import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  createConsent,
  fetchConsentsByImageOrderId,
} from "@/features/labimaging/imagingacquisition/api";
import {
  fetchConsentsRequest,
  fetchConsentsSuccess,
  fetchConsentsFailure,
  createConsentRequest,
  createConsentSuccess,
  createConsentFailure,
} from "@/features/labimaging/imagingacquisition/slice";
import type {
  ConsentCreateRequest,
  ConsentSummary,
} from "@/features/labimaging/imagingacquisition/types";

/**
 * imagingacquisition saga — API 호출은 여기서만 (가이드 10.3).
 * 실패 시 Error.message(백엔드 message)를 그대로 실어 보내고, 문구 변환은 컴포넌트에서 처리.
 */
function* fetchConsentsSaga(action: PayloadAction<string>) {
  const imageOrderId = action.payload;
  try {
    const list: ConsentSummary[] = yield call(
      fetchConsentsByImageOrderId,
      imageOrderId,
    );
    // 대상 오더를 같이 넘긴다. 0건일 때 목록만으로는 어느 오더의 결과인지 알 수 없다.
    yield put(fetchConsentsSuccess({ imageOrderId, consents: list }));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load consent history.";
    yield put(fetchConsentsFailure(message));
  }
}

/**
 * 등록에 성공하면 그 오더의 동의 이력을 다시 불러온다.
 * 방금 등록한 동의가 아래 목록에 바로 보여야 담당자가 결과를 확인할 수 있다.
 */
function* createConsentSaga(action: PayloadAction<ConsentCreateRequest>) {
  const request = action.payload;
  try {
    const created: ConsentSummary = yield call(createConsent, request);
    yield put(createConsentSuccess(created));
    yield put(fetchConsentsRequest(request.imageOrderId));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to register consent.";
    yield put(createConsentFailure(message));
  }
}

export default function* consentSaga() {
  yield takeLatest(fetchConsentsRequest.type, fetchConsentsSaga);
  yield takeLatest(createConsentRequest.type, createConsentSaga);
}
