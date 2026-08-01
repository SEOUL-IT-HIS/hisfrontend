import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createKtas, getKtasHistory, updateKtas } from "@/features/emergency/ktas/api";
import {
  createKtasRequest,
  fetchKtasHistoryFailure,
  fetchKtasHistoryRequest,
  fetchKtasHistorySuccess,
  ktasSubmitFailure,
  ktasSubmitSuccess,
  reassessKtasRequest,
} from "@/features/emergency/ktas/slice";
import type { KtasCreateRequest, KtasUpdateRequest, TriageAssessment } from "@/features/emergency/ktas/types";

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

export default function* ktasSaga() {
  yield takeLatest(fetchKtasHistoryRequest.type, fetchKtasHistorySaga);
  yield takeLatest(createKtasRequest.type, createKtasSaga);
  yield takeLatest(reassessKtasRequest.type, reassessKtasSaga);
}
