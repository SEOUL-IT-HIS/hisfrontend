import { all, call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import { NursingAssessmentDTO, RegisterNursingAssessmentRequest, UpdateNursingAssessmentRequest } from "../types";
import { createNursingAssessmentApi, deleteNursingAssessmentApi, fetchNursingAssessmentApi, fetchNursingAssessmentDetailApi, updateNursingAssessmentApi } from "./api";



function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "알 수 없는 오류가 발생했습니다.";
}

function  *fetchNursingAssessmentSaga() {
  try {
    const nursingAssessments: NursingAssessmentDTO[] = yield call(fetchNursingAssessmentApi);
    yield put({ type: "nursingassessment/fetchNursingAssessmentsSuccess", payload: nursingAssessments ?? [] });
    } catch (e:unknown) {
        yield put({ type: "nursingassessment/fetchNursingAssessmentsFailure", payload: extractErrorMessage(e) });
    }
}

function* fetchNursingAssessmentDetailSaga(action: PayloadAction<string>) {
  try {
    const nursingAssessment: NursingAssessmentDTO = yield call(fetchNursingAssessmentDetailApi, action.payload);
    yield put({ type: "nursingassessment/fetchNursingAssessmentDetailSuccess", payload: nursingAssessment });
  } catch (e: unknown) {
    yield put({ type: "nursingassessment/fetchNursingAssessmentDetailFailure", payload: extractErrorMessage(e) });
  }
}

function* createNursingAssessmentSaga(action: PayloadAction<RegisterNursingAssessmentRequest>) {
  try {
    const nursingAssessment: NursingAssessmentDTO = yield call(createNursingAssessmentApi, action.payload);
    yield put({ type: "nursingassessment/createNursingAssessmentSuccess", payload: nursingAssessment });
  } catch (e: unknown) {
    yield put({ type: "nursingassessment/createNursingAssessmentFailure", payload: extractErrorMessage(e) });
  }
}

function* updateNursingAssessmentSaga(action: PayloadAction<UpdateNursingAssessmentRequest>) {
  try {
    const nursingAssessment: NursingAssessmentDTO = yield call(updateNursingAssessmentApi, action.payload);
    yield put({ type: "nursingassessment/updateNursingAssessmentSuccess", payload: nursingAssessment });
  } catch (e: unknown) {
    yield put({ type: "nursingassessment/updateNursingAssessmentFailure", payload: extractErrorMessage(e) });
  }
}
function* deleteNursingAssessmentSaga(action: PayloadAction<string>) {
  try {
    yield call(deleteNursingAssessmentApi, action.payload);
    yield put({ type: "nursingassessment/deleteNursingAssessmentSuccess", payload: action.payload });
  } catch (e: unknown) {
    yield put({ type: "nursingassessment/deleteNursingAssessmentFailure", payload: extractErrorMessage(e) });
  }
}


export default function* nursingassessmentSaga() {
  yield all([
    takeLatest("nursingassessment/fetchNursingAssessmentsRequest", fetchNursingAssessmentSaga),
    takeLatest("nursingassessment/fetchNursingAssessmentDetailRequest", fetchNursingAssessmentDetailSaga),
    takeLatest("nursingassessment/createNursingAssessmentRequest", createNursingAssessmentSaga),
    takeLatest("nursingassessment/updateNursingAssessmentRequest", updateNursingAssessmentSaga),
    takeLatest("nursingassessment/deleteNursingAssessmentRequest", deleteNursingAssessmentSaga),
  ]);
}