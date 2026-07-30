import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  createIsolation,
  createKtas,
  createRiskScreening,
  createVitalAssessments,
  getEmsInfo,
  getIsolations,
  getKtasHistory,
  getRiskScreenings,
  getVitalAssessments,
  releaseIsolation,
  updateKtas,
} from "@/features/emergency/api";
import {
  createIsolationRequest,
  createKtasRequest,
  createRiskScreeningRequest,
  createVitalsRequest,
  fetchEmsInfoRequest,
  fetchEmsInfoSuccess,
  fetchEmsInfoFailure,
  fetchIsolationsRequest,
  fetchIsolationsSuccess,
  fetchIsolationsFailure,
  fetchKtasHistoryRequest,
  fetchKtasHistorySuccess,
  fetchKtasHistoryFailure,
  fetchRiskScreeningsRequest,
  fetchRiskScreeningsSuccess,
  fetchRiskScreeningsFailure,
  fetchVitalsRequest,
  fetchVitalsSuccess,
  fetchVitalsFailure,
  isolationSubmitSuccess,
  isolationSubmitFailure,
  ktasSubmitSuccess,
  ktasSubmitFailure,
  createVitalsSuccess,
  createVitalsFailure,
  releaseIsolationRequest,
  reassessKtasRequest,
  riskScreeningSubmitSuccess,
  riskScreeningSubmitFailure,
} from "@/features/emergency/slice";
import type {
  EmsReferral,
  EwsRecord,
  IsolationAssessment,
  IsolationCreateRequest,
  KtasCreateRequest,
  KtasUpdateRequest,
  RiskScreening,
  RiskScreeningCreateRequest,
  TriageAssessment,
  VitalAssessmentCreateRequest,
} from "@/features/emergency/types";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

// ----- EMS 정보 조회 (UD2-8) -----
function* fetchEmsInfoSaga(action: PayloadAction<string | undefined>) {
  try {
    const items: EmsReferral[] = yield call(getEmsInfo, action.payload);
    yield put(fetchEmsInfoSuccess(items));
  } catch (err) {
    yield put(fetchEmsInfoFailure(errorMessage(err, "EMS 정보 조회에 실패했습니다.")));
  }
}

// ----- KTAS 분류/재평가 (UD2-9, UD2-43) -----
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

// ----- 초기 환자상태 평가 / 활력징후 (UD2-10) -----
function* fetchVitalsSaga(action: PayloadAction<string>) {
  try {
    const items: EwsRecord[] = yield call(getVitalAssessments, action.payload);
    yield put(fetchVitalsSuccess(items));
  } catch (err) {
    yield put(fetchVitalsFailure(errorMessage(err, "활력징후 조회에 실패했습니다.")));
  }
}

function* createVitalsSaga(action: PayloadAction<VitalAssessmentCreateRequest>) {
  try {
    const items: EwsRecord[] = yield call(createVitalAssessments, action.payload);
    yield put(createVitalsSuccess(items));
  } catch (err) {
    yield put(createVitalsFailure(errorMessage(err, "활력징후 등록에 실패했습니다.")));
  }
}

// ----- 감염병 격리 관리 (UD2-11) -----
function* fetchIsolationsSaga(action: PayloadAction<string>) {
  try {
    const items: IsolationAssessment[] = yield call(getIsolations, action.payload);
    yield put(fetchIsolationsSuccess(items));
  } catch (err) {
    yield put(fetchIsolationsFailure(errorMessage(err, "격리 이력 조회에 실패했습니다.")));
  }
}

function* createIsolationSaga(action: PayloadAction<IsolationCreateRequest>) {
  try {
    const item: IsolationAssessment = yield call(createIsolation, action.payload);
    yield put(isolationSubmitSuccess(item));
  } catch (err) {
    yield put(isolationSubmitFailure(errorMessage(err, "격리 등록에 실패했습니다.")));
  }
}

function* releaseIsolationSaga(action: PayloadAction<string>) {
  try {
    const item: IsolationAssessment = yield call(releaseIsolation, action.payload);
    yield put(isolationSubmitSuccess(item));
  } catch (err) {
    yield put(isolationSubmitFailure(errorMessage(err, "격리 해제에 실패했습니다.")));
  }
}

// ----- 패혈증-뇌졸중 위험도 스크리닝 (UD2-12) -----
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

/** ER-TRIAGE 요청을 감시한다 (최신 요청만 처리) */
export default function* triageSaga() {
  yield takeLatest(fetchEmsInfoRequest.type, fetchEmsInfoSaga);
  yield takeLatest(fetchKtasHistoryRequest.type, fetchKtasHistorySaga);
  yield takeLatest(createKtasRequest.type, createKtasSaga);
  yield takeLatest(reassessKtasRequest.type, reassessKtasSaga);
  yield takeLatest(fetchVitalsRequest.type, fetchVitalsSaga);
  yield takeLatest(createVitalsRequest.type, createVitalsSaga);
  yield takeLatest(fetchIsolationsRequest.type, fetchIsolationsSaga);
  yield takeLatest(createIsolationRequest.type, createIsolationSaga);
  yield takeLatest(releaseIsolationRequest.type, releaseIsolationSaga);
  yield takeLatest(fetchRiskScreeningsRequest.type, fetchRiskScreeningsSaga);
  yield takeLatest(createRiskScreeningRequest.type, createRiskScreeningSaga);
}
