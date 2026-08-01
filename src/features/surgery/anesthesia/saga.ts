import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  appendVitalSigns,
  createAnesthesiaRecord,
  getAnesthesiaRecord,
  getAnesthesiaRecords,
} from "@/features/surgery/anesthesia/api";
import {
  anesthesiaMutationFailure,
  anesthesiaMutationSuccess,
  appendVitalSignsRequest,
  createAnesthesiaRecordRequest,
  fetchAnesthesiaRecordFailure,
  fetchAnesthesiaRecordRequest,
  fetchAnesthesiaRecordSuccess,
  fetchAnesthesiaRecordsFailure,
  fetchAnesthesiaRecordsRequest,
  fetchAnesthesiaRecordsSuccess,
} from "@/features/surgery/anesthesia/slice";
import type {
  AnesthesiaRecord,
  AppendVitalSignsRequest,
  CreateAnesthesiaRecordRequest,
} from "@/features/surgery/anesthesia/types";

/**
 * 마취기록 saga (SL2-3)
 *
 * <p>API 호출은 여기서만 한다(§10.3).</p>
 */

function* fetchAnesthesiaRecordsSaga(action: PayloadAction<string>) {
  try {
    const response: AnesthesiaRecord[] = yield call(
      getAnesthesiaRecords,
      action.payload,
    );
    yield put(fetchAnesthesiaRecordsSuccess(response));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "마취기록 조회에 실패했습니다.";
    yield put(fetchAnesthesiaRecordsFailure(message));
  }
}

function* fetchAnesthesiaRecordSaga(action: PayloadAction<string>) {
  try {
    const response: AnesthesiaRecord = yield call(
      getAnesthesiaRecord,
      action.payload,
    );
    yield put(fetchAnesthesiaRecordSuccess(response));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "마취기록 조회에 실패했습니다.";
    yield put(fetchAnesthesiaRecordFailure(message));
  }
}

function* createAnesthesiaRecordSaga(
  action: PayloadAction<{
    surgeryId: string;
    request: CreateAnesthesiaRecordRequest;
  }>,
) {
  try {
    const { surgeryId, request } = action.payload;
    yield call(createAnesthesiaRecord, surgeryId, request);
    yield put(anesthesiaMutationSuccess());
    yield put(fetchAnesthesiaRecordsRequest(surgeryId));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "마취기록 등록에 실패했습니다.";
    yield put(anesthesiaMutationFailure(message));
  }
}

/**
 * 활력징후 추가 (SL2-18)
 *
 * <p>누적 결과를 화면에 반영하기 위해 성공 후 해당 수술의 기록 목록을 다시 불러온다.</p>
 */
function* appendVitalSignsSaga(
  action: PayloadAction<{
    anesthesiaId: string;
    surgeryId: string;
    request: AppendVitalSignsRequest;
  }>,
) {
  try {
    const { anesthesiaId, surgeryId, request } = action.payload;
    yield call(appendVitalSigns, anesthesiaId, request);
    yield put(anesthesiaMutationSuccess());
    yield put(fetchAnesthesiaRecordsRequest(surgeryId));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "활력징후 기록에 실패했습니다.";
    yield put(anesthesiaMutationFailure(message));
  }
}

/** 마취기록 관련 요청을 감시한다(최신 요청만 처리) */
export default function* anesthesiaSaga() {
  yield takeLatest(
    fetchAnesthesiaRecordsRequest.type,
    fetchAnesthesiaRecordsSaga,
  );
  yield takeLatest(fetchAnesthesiaRecordRequest.type, fetchAnesthesiaRecordSaga);
  yield takeLatest(
    createAnesthesiaRecordRequest.type,
    createAnesthesiaRecordSaga,
  );
  yield takeLatest(appendVitalSignsRequest.type, appendVitalSignsSaga);
}
