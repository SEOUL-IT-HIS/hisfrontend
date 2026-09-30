import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  confirmLabResult,
  createLabResult,
  fetchLabResultItems,
  updateLabResult,
} from "@/features/labimaging/labresult/api";
import {
  fetchLabResultItemsRequest,
  fetchLabResultItemsSuccess,
  fetchLabResultItemsFailure,
  createLabResultRequest,
  updateLabResultRequest,
  confirmLabResultRequest,
  submitLabResultSuccess,
  submitLabResultFailure,
} from "@/features/labimaging/labresult/slice";
import type {
  LabResultConfirmRequest,
  LabResultCreateRequest,
  LabResultItem,
  LabResultSummary,
  LabResultUpdateRequest,
} from "@/features/labimaging/labresult/types";

/**
 * labresult saga — API 호출은 여기서만 (가이드 10.3).
 * 실패 시 Error.message(백엔드 message)를 그대로 실어 보내고, 문구 변환은 컴포넌트에서 처리.
 */
function* fetchLabResultItemsSaga(action: PayloadAction<string>) {
  try {
    const items: LabResultItem[] = yield call(fetchLabResultItems, action.payload);
    yield put(fetchLabResultItemsSuccess(items));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load test items.";
    yield put(fetchLabResultItemsFailure(message));
  }
}

/**
 * ⚠ 등록·수정·확정 세 saga 가 모두 성공 후 목록을 다시 부른다.
 *   방금 입력한 결과가 목록에 바로 보여야 담당자가 결과를 확인할 수 있고,
 *   비정상 여부(abnormalYn)는 서버가 계산해 돌려주는 값이라 다시 받아야 정확하다.
 *   (검체 등록/판정 saga 와 같은 구조)
 */
function* createLabResultSaga(
  action: PayloadAction<{ request: LabResultCreateRequest; receptionNo: string }>,
) {
  const { request, receptionNo } = action.payload;
  try {
    const saved: LabResultSummary = yield call(createLabResult, request);
    yield put(submitLabResultSuccess(saved));
    yield put(fetchLabResultItemsRequest(receptionNo));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to register test result.";
    yield put(submitLabResultFailure(message));
  }
}

function* updateLabResultSaga(
  action: PayloadAction<{
    labResultId: string;
    request: LabResultUpdateRequest;
    receptionNo: string;
  }>,
) {
  const { labResultId, request, receptionNo } = action.payload;
  try {
    const saved: LabResultSummary = yield call(updateLabResult, labResultId, request);
    yield put(submitLabResultSuccess(saved));
    yield put(fetchLabResultItemsRequest(receptionNo));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update test result.";
    yield put(submitLabResultFailure(message));
  }
}

function* confirmLabResultSaga(
  action: PayloadAction<{
    labResultId: string;
    request: LabResultConfirmRequest;
    receptionNo: string;
  }>,
) {
  const { labResultId, request, receptionNo } = action.payload;
  try {
    const saved: LabResultSummary = yield call(confirmLabResult, labResultId, request);
    yield put(submitLabResultSuccess(saved));
    yield put(fetchLabResultItemsRequest(receptionNo));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to confirm test result.";
    yield put(submitLabResultFailure(message));
  }
}

export default function* labResultSaga() {
  yield takeLatest(fetchLabResultItemsRequest.type, fetchLabResultItemsSaga);
  yield takeLatest(createLabResultRequest.type, createLabResultSaga);
  yield takeLatest(updateLabResultRequest.type, updateLabResultSaga);
  yield takeLatest(confirmLabResultRequest.type, confirmLabResultSaga);
}
