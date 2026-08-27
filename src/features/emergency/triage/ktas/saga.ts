import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createKtas, getKtasHistory, updateKtas } from "@/features/emergency/triage/ktas/api";
import {
  createKtasRequest,
  fetchKtasHistoryFailure,
  fetchKtasHistoryRequest,
  fetchKtasHistorySuccess,
  ktasSubmitFailure,
  ktasSubmitSuccess,
  reassessKtasRequest,
} from "@/features/emergency/triage/ktas/slice";
import { fetchReceptionListRequest } from "@/features/emergency/receptionList/slice";
import type { KtasCreateRequest, KtasUpdateRequest, TriageAssessment } from "@/features/emergency/triage/ktas/types";

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
    // 왼쪽 접수목록의 KTAS 배지가 최신 등급을 반영하도록 목록을 다시 불러온다.
    yield put(fetchReceptionListRequest());
  } catch (err) {
    yield put(ktasSubmitFailure(errorMessage(err, "KTAS 등급 분류 등록에 실패했습니다.")));
  }
}

function* reassessKtasSaga(action: PayloadAction<{ id: string; request: KtasUpdateRequest }>) {
  try {
    const item: TriageAssessment = yield call(updateKtas, action.payload.id, action.payload.request);
    yield put(ktasSubmitSuccess(item));
    yield put(fetchReceptionListRequest());
  } catch (err) {
    yield put(ktasSubmitFailure(errorMessage(err, "KTAS 재평가에 실패했습니다.")));
  }
}

export default function* ktasSaga() {
  yield takeLatest(fetchKtasHistoryRequest.type, fetchKtasHistorySaga);
  yield takeLatest(createKtasRequest.type, createKtasSaga);
  yield takeLatest(reassessKtasRequest.type, reassessKtasSaga);
}
