import { all, call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import { RiskAssessmentDTO, RegisterRiskAssessmentRequest, UpdateRiskAssessmentRequest } from "../types";
import { createRiskAssessmentApi, deleteRiskAssessmentApi, fetchRiskAssessmentApi, fetchRiskAssessmentDetailApi, updateRiskAssessmentApi } from "./api";



function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "알 수 없는 오류가 발생했습니다.";
}

function  *fetchRiskAssessmentSaga() {
  try {
    const riskAssessments: RiskAssessmentDTO[] = yield call(fetchRiskAssessmentApi);
    yield put({ type: "riskAssessment/fetchRiskAssessmentsSuccess", payload: riskAssessments ?? [] });
    } catch (e:unknown) {
        yield put({ type: "riskAssessment/fetchRiskAssessmentsFailure", payload: extractErrorMessage(e) });
    }
}

function* fetchRiskAssessmentDetailSaga(action: PayloadAction<string>) {
  try {
    const riskAssessment: RiskAssessmentDTO = yield call(fetchRiskAssessmentDetailApi, action.payload);
    yield put({ type: "riskAssessment/fetchRiskAssessmentDetailSuccess", payload: riskAssessment });
  } catch (e: unknown) {
    yield put({ type: "riskAssessment/fetchRiskAssessmentDetailFailure", payload: extractErrorMessage(e) });
  }
}

function* createRiskAssessmentSaga(action: PayloadAction<RegisterRiskAssessmentRequest>) {
  try {
    const riskAssessment: RiskAssessmentDTO = yield call(createRiskAssessmentApi, action.payload);
    yield put({ type: "riskAssessment/createRiskAssessmentSuccess", payload: riskAssessment });
  } catch (e: unknown) {
    yield put({ type: "riskAssessment/createRiskAssessmentFailure", payload: extractErrorMessage(e) });
  }
}

function* updateRiskAssessmentSaga(action: PayloadAction<UpdateRiskAssessmentRequest>) {
  try {
    const riskAssessment: RiskAssessmentDTO = yield call(updateRiskAssessmentApi, action.payload);
    yield put({ type: "riskAssessment/updateRiskAssessmentSuccess", payload: riskAssessment });
  } catch (e: unknown) {
    yield put({ type: "riskAssessment/updateRiskAssessmentFailure", payload: extractErrorMessage(e) });
  }
}
function* deleteRiskAssessmentSaga(action: PayloadAction<string>) {
  try {
    yield call(deleteRiskAssessmentApi, action.payload);
    yield put({ type: "riskAssessment/deleteRiskAssessmentSuccess", payload: action.payload });
  } catch (e: unknown) {
    yield put({ type: "riskAssessment/deleteRiskAssessmentFailure", payload: extractErrorMessage(e) });
  }
}


export default function* riskAssessmentSaga() {
  yield all([
    takeLatest("riskAssessment/fetchRiskAssessmentsRequest", fetchRiskAssessmentSaga),
    takeLatest("riskAssessment/fetchRiskAssessmentDetailRequest", fetchRiskAssessmentDetailSaga),
    takeLatest("riskAssessment/createRiskAssessmentRequest", createRiskAssessmentSaga),
    takeLatest("riskAssessment/updateRiskAssessmentRequest", updateRiskAssessmentSaga),
    takeLatest("riskAssessment/deleteRiskAssessmentRequest", deleteRiskAssessmentSaga),
  ]);
}