import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  createLabOrder,
  fetchLabReceptions,
  fetchLabReceptionByNo,
} from "@/features/labimaging/laborder/api";
import {
  createLabOrderFailure,
  createLabOrderRequest,
  createLabOrderSuccess,
  fetchLabReceptionsRequest,
  fetchLabReceptionsSuccess,
  fetchLabReceptionsFailure,
  fetchLabReceptionByNoRequest,
  fetchLabReceptionByNoSuccess,
  fetchLabReceptionByNoFailure,
} from "@/features/labimaging/laborder/slice";
import type {
  LabOrderCreateRequest,
  LabOrderCreateResponse,
  LabReceptionDetail,
  LabReceptionSummary,
  ReceptionScheduledFilter,
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

function* fetchLabReceptionsSaga(
  action: PayloadAction<ReceptionScheduledFilter | undefined>,
) {
  try {
    // "ALL"(또는 미지정)이면 파라미터를 보내지 않아 백엔드가 전체를 반환한다.
    const filter = action.payload;
    const scheduledYn = filter && filter !== "ALL" ? filter : undefined;

    const list: LabReceptionSummary[] = yield call(fetchLabReceptions, scheduledYn);
    yield put(fetchLabReceptionsSuccess(list));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "접수 목록 조회에 실패했습니다.";
    yield put(fetchLabReceptionsFailure(message));
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

export default function* labOrderSaga() {
  yield takeLatest(createLabOrderRequest.type, createLabOrderSaga);
  yield takeLatest(fetchLabReceptionsRequest.type, fetchLabReceptionsSaga);
  yield takeLatest(fetchLabReceptionByNoRequest.type, fetchLabReceptionByNoSaga);
}
