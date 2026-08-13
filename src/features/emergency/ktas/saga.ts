import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createKtas, getKtasHistory, getKtasLevelCodes, updateKtas } from "@/features/emergency/ktas/api";
import {
  createKtasRequest,
  fetchKtasHistoryFailure,
  fetchKtasHistoryRequest,
  fetchKtasHistorySuccess,
  fetchKtasLevelCodesFailure,
  fetchKtasLevelCodesRequest,
  fetchKtasLevelCodesSuccess,
  ktasSubmitFailure,
  ktasSubmitSuccess,
  reassessKtasRequest,
} from "@/features/emergency/ktas/slice";
import type {
  KtasCreateRequest,
  KtasLevelCode,
  KtasUpdateRequest,
  TriageAssessment,
} from "@/features/emergency/ktas/types";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function* fetchKtasHistorySaga(action: PayloadAction<string>) {
  try {
    const items: TriageAssessment[] = yield call(getKtasHistory, action.payload);
    yield put(fetchKtasHistorySuccess(items));
  } catch (err) {
    yield put(fetchKtasHistoryFailure(errorMessage(err, "KTAS 이력 조회에 실패했습니다.")));
  }
}

function* createKtasSaga(action: PayloadAction<KtasCreateRequest>) {
  try {
    const item: TriageAssessment = yield call(createKtas, action.payload);
    yield put(ktasSubmitSuccess(item));
  } catch (err) {
    yield put(ktasSubmitFailure(errorMessage(err, "KTAS 등급 분류 등록에 실패했습니다.")));
  }
}

function* reassessKtasSaga(action: PayloadAction<{ id: string; request: KtasUpdateRequest }>) {
  try {
    const item: TriageAssessment = yield call(updateKtas, action.payload.id, action.payload.request);
    yield put(ktasSubmitSuccess(item));
  } catch (err) {
    yield put(ktasSubmitFailure(errorMessage(err, "KTAS 재평가에 실패했습니다.")));
  }
}

function* fetchKtasLevelCodesSaga() {
  try {
    const codes: KtasLevelCode[] = yield call(getKtasLevelCodes);
    yield put(fetchKtasLevelCodesSuccess(codes));
  } catch {
    // 실패해도 화면은 폴백 상수로 계속 동작하므로 별도 에러 메시지는 안 둔다.
    yield put(fetchKtasLevelCodesFailure());
  }
}

export default function* ktasSaga() {
  yield takeLatest(fetchKtasHistoryRequest.type, fetchKtasHistorySaga);
  yield takeLatest(createKtasRequest.type, createKtasSaga);
  yield takeLatest(reassessKtasRequest.type, reassessKtasSaga);
  yield takeLatest(fetchKtasLevelCodesRequest.type, fetchKtasLevelCodesSaga);
}
