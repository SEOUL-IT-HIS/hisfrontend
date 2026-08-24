import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  createSpecimen,
  fetchSpecimensByReceptionNo,
} from "@/features/labimaging/labspecimen/api";
import {
  fetchSpecimensRequest,
  fetchSpecimensSuccess,
  fetchSpecimensFailure,
  createSpecimenRequest,
  createSpecimenSuccess,
  createSpecimenFailure,
} from "@/features/labimaging/labspecimen/slice";
import type {
  SpecimenCreateRequest,
  SpecimenSummary,
} from "@/features/labimaging/labspecimen/types";

/**
 * labspecimen saga — API 호출은 여기서만 (가이드 10.3).
 * 실패 시 Error.message(백엔드 message)를 그대로 실어 보내고, 문구 변환은 컴포넌트에서 처리.
 */
function* fetchSpecimensSaga(action: PayloadAction<string>) {
  try {
    const list: SpecimenSummary[] = yield call(
      fetchSpecimensByReceptionNo,
      action.payload,
    );
    yield put(fetchSpecimensSuccess(list));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "검체 목록 조회에 실패했습니다.";
    yield put(fetchSpecimensFailure(message));
  }
}

/**
 * 등록에 성공하면 그 접수의 검체 목록을 다시 불러온다.
 * 방금 등록한 검체가 아래 목록에 바로 보여야 담당자가 결과를 확인할 수 있다.
 */
function* createSpecimenSaga(
  action: PayloadAction<{ request: SpecimenCreateRequest; receptionNo: string }>,
) {
  const { request, receptionNo } = action.payload;
  try {
    const created: SpecimenSummary = yield call(createSpecimen, request);
    yield put(createSpecimenSuccess(created));
    yield put(fetchSpecimensRequest(receptionNo));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "검체 등록에 실패했습니다.";
    yield put(createSpecimenFailure(message));
  }
}

export default function* labSpecimenSaga() {
  yield takeLatest(fetchSpecimensRequest.type, fetchSpecimensSaga);
  yield takeLatest(createSpecimenRequest.type, createSpecimenSaga);
}
