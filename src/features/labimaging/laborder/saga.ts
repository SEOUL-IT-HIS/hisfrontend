import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  createLabOrder,
  excludeReception,
  fetchLabReceptionByNo,
  fetchLabWorklist,
  restoreReception,
} from "@/features/labimaging/laborder/api";
import {
  createLabOrderFailure,
  createLabOrderRequest,
  createLabOrderSuccess,
  fetchLabReceptionByNoRequest,
  fetchLabReceptionByNoSuccess,
  fetchLabReceptionByNoFailure,
  fetchLabWorklistRequest,
  fetchLabWorklistSuccess,
  fetchLabWorklistFailure,
  excludeReceptionRequest,
  restoreReceptionRequest,
  exclusionSuccess,
  exclusionFailure,
} from "@/features/labimaging/laborder/slice";
import type {
  LabOrderCreateRequest,
  LabOrderCreateResponse,
  LabReceptionDetail,
  LabWorklistItem,
  WorklistStatusFilter,
} from "@/features/labimaging/laborder/types";

/**
 * labOrder saga — API 호출은 여기서만 (가이드 10.3).
 * 실패 시 Error.message(백엔드 message)를 그대로 실어 보내고, 문구 변환은 컴포넌트에서 처리.
 */
function* createLabOrderSaga(action: PayloadAction<LabOrderCreateRequest>) {
  try {
    const response: LabOrderCreateResponse = yield call(
      createLabOrder,
      action.payload,
    );
    yield put(createLabOrderSuccess(response));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "검사 오더 접수에 실패했습니다.";
    yield put(createLabOrderFailure(message));
  }
}

function* fetchLabReceptionByNoSaga(action: PayloadAction<string>) {
  try {
    const reception: LabReceptionDetail = yield call(
      fetchLabReceptionByNo,
      action.payload,
    );
    yield put(fetchLabReceptionByNoSuccess(reception));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "접수 조회에 실패했습니다.";
    yield put(fetchLabReceptionByNoFailure(message));
  }
}

/** 필터를 API 파라미터로 바꾼다. "ALL"이면 파라미터를 보내지 않아 백엔드가 전체를 반환한다. */
function toStatusParam(filter?: WorklistStatusFilter) {
  return filter && filter !== "ALL" ? filter : undefined;
}

function* fetchLabWorklistSaga(
  action: PayloadAction<WorklistStatusFilter | undefined>,
) {
  try {
    const list: LabWorklistItem[] = yield call(
      fetchLabWorklist,
      toStatusParam(action.payload),
    );
    yield put(fetchLabWorklistSuccess(list));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "워크리스트 조회에 실패했습니다.";
    yield put(fetchLabWorklistFailure(message));
  }
}

/**
 * 제외 처리 후 목록을 다시 불러온다.
 * 처리만 하고 끝내면 방금 제외한 건이 화면에 그대로 남아 있어, 담당자는 실패한 줄 안다.
 */
function* excludeReceptionSaga(
  action: PayloadAction<{
    receptionNo: string;
    exclusionReason: string;
    filter: WorklistStatusFilter;
  }>,
) {
  const { receptionNo, exclusionReason, filter } = action.payload;
  try {
    yield call(excludeReception, receptionNo, { exclusionReason });
    yield put(exclusionSuccess());
    yield put(fetchLabWorklistRequest(filter));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "접수 제외에 실패했습니다.";
    yield put(exclusionFailure(message));
  }
}

function* restoreReceptionSaga(
  action: PayloadAction<{ receptionNo: string; filter: WorklistStatusFilter }>,
) {
  const { receptionNo, filter } = action.payload;
  try {
    yield call(restoreReception, receptionNo);
    yield put(exclusionSuccess());
    yield put(fetchLabWorklistRequest(filter));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "접수 복구에 실패했습니다.";
    yield put(exclusionFailure(message));
  }
}

export default function* labOrderSaga() {
  yield takeLatest(createLabOrderRequest.type, createLabOrderSaga);
  yield takeLatest(fetchLabReceptionByNoRequest.type, fetchLabReceptionByNoSaga);
  yield takeLatest(fetchLabWorklistRequest.type, fetchLabWorklistSaga);
  yield takeLatest(excludeReceptionRequest.type, excludeReceptionSaga);
  yield takeLatest(restoreReceptionRequest.type, restoreReceptionSaga);
}
