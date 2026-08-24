import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createRiskScreening, getRiskScreenings } from "@/features/emergency/triage/riskScreening/api";
import {
  createRiskScreeningRequest,
  fetchRiskScreeningsFailure,
  fetchRiskScreeningsRequest,
  fetchRiskScreeningsSuccess,
  riskScreeningSubmitFailure,
  riskScreeningSubmitSuccess,
} from "@/features/emergency/triage/riskScreening/slice";
import type { RiskScreening, RiskScreeningCreateRequest } from "@/features/emergency/triage/riskScreening/types";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function* fetchRiskScreeningsSaga(action: PayloadAction<string>) {
  try {
    const items: RiskScreening[] = yield call(getRiskScreenings, action.payload);
    yield put(fetchRiskScreeningsSuccess(items));
  } catch (err) {
    yield put(fetchRiskScreeningsFailure(errorMessage(err, "위험 스크리닝 조회에 실패했습니다.")));
  }
}

function* createRiskScreeningSaga(action: PayloadAction<RiskScreeningCreateRequest>) {
  try {
    const item: RiskScreening = yield call(createRiskScreening, action.payload);
    yield put(riskScreeningSubmitSuccess(item));
  } catch (err) {
    yield put(riskScreeningSubmitFailure(errorMessage(err, "위험 스크리닝 등록에 실패했습니다.")));
  }
}

export default function* riskScreeningSaga() {
  yield takeLatest(fetchRiskScreeningsRequest.type, fetchRiskScreeningsSaga);
  yield takeLatest(createRiskScreeningRequest.type, createRiskScreeningSaga);
}
