import { call, put, select, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  fetchInterfaceSendLogDetail,
  fetchInterfaceSendLogs,
  resendInterfaceSendLog,
} from "@/features/labimaging/interfacelog/api";
import {
  fetchInterfaceSendLogsRequest,
  fetchInterfaceSendLogsSuccess,
  fetchInterfaceSendLogsFailure,
  fetchInterfaceSendLogDetailRequest,
  fetchInterfaceSendLogDetailSuccess,
  fetchInterfaceSendLogDetailFailure,
  resendInterfaceSendLogRequest,
  resendInterfaceSendLogSuccess,
  resendInterfaceSendLogFailure,
  selectInterfaceSendLogSearch,
} from "@/features/labimaging/interfacelog/slice";
import type {
  InterfaceSendLog,
  InterfaceSendLogSearch,
  PageResponse,
} from "@/features/labimaging/interfacelog/types";

/**
 * 연계 발신 이력 saga — ZP2-120 / ZP2-124 (5차 Phase 6)
 */
function* fetchListSaga(action: PayloadAction<InterfaceSendLogSearch>) {
  try {
    const page: PageResponse<InterfaceSendLog> = yield call(fetchInterfaceSendLogs, action.payload);
    yield put(fetchInterfaceSendLogsSuccess(page));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load send history.";
    yield put(fetchInterfaceSendLogsFailure(message));
  }
}

function* fetchDetailSaga(action: PayloadAction<string>) {
  try {
    const detail: InterfaceSendLog = yield call(fetchInterfaceSendLogDetail, action.payload);
    yield put(fetchInterfaceSendLogDetailSuccess(detail));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load send history detail.";
    yield put(fetchInterfaceSendLogDetailFailure(message));
  }
}

/**
 * ⚠ 재전송 응답은 "요청 접수" 시점이다(Kafka 결과는 비동기로 기록된다). 상세와 목록을 같은 조건으로 다시 불러와
 *   재시도 횟수·상태 변화를 보여준다. 결과가 늦게 기록되면 사용자가 새로고침으로 다시 확인한다.
 */
function* resendSaga(action: PayloadAction<string>) {
  try {
    const saved: InterfaceSendLog = yield call(resendInterfaceSendLog, action.payload);
    yield put(resendInterfaceSendLogSuccess(saved));
    yield put(fetchInterfaceSendLogDetailRequest(action.payload));
    const search: InterfaceSendLogSearch = yield select(selectInterfaceSendLogSearch);
    yield put(fetchInterfaceSendLogsRequest(search));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to resend.";
    yield put(resendInterfaceSendLogFailure(message));
  }
}

export default function* interfaceSendLogSaga() {
  yield takeLatest(fetchInterfaceSendLogsRequest.type, fetchListSaga);
  yield takeLatest(fetchInterfaceSendLogDetailRequest.type, fetchDetailSaga);
  yield takeLatest(resendInterfaceSendLogRequest.type, resendSaga);
}
