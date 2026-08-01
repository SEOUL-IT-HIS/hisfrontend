import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  createOperativeRecord,
  getOperativeRecord,
  getOperativeRecords,
  updateOperativeRecord,
} from "@/features/surgery/operativeRecord/api";
import {
  createOperativeRecordRequest,
  fetchOperativeRecordFailure,
  fetchOperativeRecordRequest,
  fetchOperativeRecordSuccess,
  fetchOperativeRecordsFailure,
  fetchOperativeRecordsRequest,
  fetchOperativeRecordsSuccess,
  operativeRecordMutationFailure,
  operativeRecordMutationSuccess,
  updateOperativeRecordRequest,
} from "@/features/surgery/operativeRecord/slice";
import type {
  CreateOperativeRecordRequest,
  OperativeRecord,
  UpdateOperativeRecordRequest,
} from "@/features/surgery/operativeRecord/types";

/**
 * 수술기록지 saga (SL2-51)
 *
 * <p>API 호출은 여기서만 한다(§10.3). 확정 기록 수정 시도는 백엔드가 SUR043 으로
 * 거부하며, 그 코드가 그대로 실패 메시지로 전달된다(§15.1).</p>
 */

function* fetchOperativeRecordsSaga(action: PayloadAction<string>) {
  try {
    const response: OperativeRecord[] = yield call(
      getOperativeRecords,
      action.payload,
    );
    yield put(fetchOperativeRecordsSuccess(response));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "수술기록 조회에 실패했습니다.";
    yield put(fetchOperativeRecordsFailure(message));
  }
}

function* fetchOperativeRecordSaga(action: PayloadAction<string>) {
  try {
    const response: OperativeRecord = yield call(
      getOperativeRecord,
      action.payload,
    );
    yield put(fetchOperativeRecordSuccess(response));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "수술기록 조회에 실패했습니다.";
    yield put(fetchOperativeRecordFailure(message));
  }
}

function* createOperativeRecordSaga(
  action: PayloadAction<{
    surgeryId: string;
    request: CreateOperativeRecordRequest;
  }>,
) {
  try {
    const { surgeryId, request } = action.payload;
    yield call(createOperativeRecord, surgeryId, request);
    yield put(operativeRecordMutationSuccess());
    yield put(fetchOperativeRecordsRequest(surgeryId));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "수술기록 작성에 실패했습니다.";
    yield put(operativeRecordMutationFailure(message));
  }
}

function* updateOperativeRecordSaga(
  action: PayloadAction<{
    recordId: string;
    surgeryId: string;
    request: UpdateOperativeRecordRequest;
  }>,
) {
  try {
    const { recordId, surgeryId, request } = action.payload;
    yield call(updateOperativeRecord, recordId, request);
    yield put(operativeRecordMutationSuccess());
    yield put(fetchOperativeRecordsRequest(surgeryId));
  } catch (err) {
    // 확정된 기록 수정 시도는 SUR043 으로 내려온다
    const message =
      err instanceof Error ? err.message : "수술기록 수정에 실패했습니다.";
    yield put(operativeRecordMutationFailure(message));
  }
}

/** 수술기록지 관련 요청을 감시한다(최신 요청만 처리) */
export default function* operativeRecordSaga() {
  yield takeLatest(
    fetchOperativeRecordsRequest.type,
    fetchOperativeRecordsSaga,
  );
  yield takeLatest(fetchOperativeRecordRequest.type, fetchOperativeRecordSaga);
  yield takeLatest(
    createOperativeRecordRequest.type,
    createOperativeRecordSaga,
  );
  yield takeLatest(
    updateOperativeRecordRequest.type,
    updateOperativeRecordSaga,
  );
}
