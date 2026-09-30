import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  assignReading,
  confirmReading,
  fetchReadingByOrderItemId,
  fetchReadingWorklist,
  updateFindings,
} from "@/features/labimaging/imaginginterpretation/api";
import {
  assignReadingRequest,
  confirmReadingRequest,
  fetchReadingDetailFailure,
  fetchReadingDetailRequest,
  fetchReadingDetailSuccess,
  fetchReadingWorklistFailure,
  fetchReadingWorklistRequest,
  fetchReadingWorklistSuccess,
  submitReadingFailure,
  submitReadingSuccess,
  updateFindingsRequest,
} from "@/features/labimaging/imaginginterpretation/slice";
import type {
  ImageReadingAssignRequest,
  ImageReadingConfirmRequest,
  ImageReadingFindingsRequest,
  ImageReadingSummary,
} from "@/features/labimaging/imaginginterpretation/types";

/**
 * imaginginterpretation saga — API 호출은 여기서만 (가이드 10.3).
 * 실패 시 Error.message(백엔드 message)를 그대로 실어 보내고, 문구 변환은 컴포넌트에서 처리.
 */
function* fetchReadingWorklistSaga() {
  try {
    const worklist: ImageReadingSummary[] = yield call(fetchReadingWorklist);
    yield put(fetchReadingWorklistSuccess(worklist));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load the reading worklist.";
    yield put(fetchReadingWorklistFailure(message));
  }
}

function* fetchReadingDetailSaga(action: PayloadAction<string>) {
  const imageOrderItemId = action.payload;
  try {
    const reading: ImageReadingSummary = yield call(
      fetchReadingByOrderItemId,
      imageOrderItemId,
    );
    yield put(fetchReadingDetailSuccess({ imageOrderItemId, reading }));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load the reading detail.";
    yield put(fetchReadingDetailFailure(message));
  }
}

/**
 * ⚠ 배정·소견저장·확정 세 saga 가 모두 성공 후 상세를 다시 불러온다.
 *   방금 반영한 상태(담당자·소견·확정정보)가 화면에 바로 보여야 담당자가 결과를 확인할 수 있다.
 *   (LabResultSaga 의 등록/수정/확정 후 목록 재조회와 같은 구조)
 */
function* assignReadingSaga(
  action: PayloadAction<{
    imageReadingId: string;
    request: ImageReadingAssignRequest;
    imageOrderItemId: string;
  }>,
) {
  const { imageReadingId, request, imageOrderItemId } = action.payload;
  try {
    const saved: ImageReadingSummary = yield call(assignReading, imageReadingId, request);
    yield put(submitReadingSuccess(saved));
    yield put(fetchReadingDetailRequest(imageOrderItemId));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to assign the reading.";
    yield put(submitReadingFailure(message));
  }
}

function* updateFindingsSaga(
  action: PayloadAction<{
    imageReadingId: string;
    request: ImageReadingFindingsRequest;
    imageOrderItemId: string;
  }>,
) {
  const { imageReadingId, request, imageOrderItemId } = action.payload;
  try {
    const saved: ImageReadingSummary = yield call(updateFindings, imageReadingId, request);
    yield put(submitReadingSuccess(saved));
    yield put(fetchReadingDetailRequest(imageOrderItemId));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save the findings.";
    yield put(submitReadingFailure(message));
  }
}

function* confirmReadingSaga(
  action: PayloadAction<{
    imageReadingId: string;
    request: ImageReadingConfirmRequest;
    imageOrderItemId: string;
  }>,
) {
  const { imageReadingId, request, imageOrderItemId } = action.payload;
  try {
    const saved: ImageReadingSummary = yield call(confirmReading, imageReadingId, request);
    yield put(submitReadingSuccess(saved));
    yield put(fetchReadingDetailRequest(imageOrderItemId));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to confirm the reading.";
    yield put(submitReadingFailure(message));
  }
}

export default function* imageReadingSaga() {
  yield takeLatest(fetchReadingWorklistRequest.type, fetchReadingWorklistSaga);
  yield takeLatest(fetchReadingDetailRequest.type, fetchReadingDetailSaga);
  yield takeLatest(assignReadingRequest.type, assignReadingSaga);
  yield takeLatest(updateFindingsRequest.type, updateFindingsSaga);
  yield takeLatest(confirmReadingRequest.type, confirmReadingSaga);
}
