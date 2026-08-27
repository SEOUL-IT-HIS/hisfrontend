import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import { getEmsInfo } from "@/features/emergency/triage/emsInfo/api";
import {
  fetchEmsInfoFailure,
  fetchEmsInfoRequest,
  fetchEmsInfoSuccess,
} from "@/features/emergency/triage/emsInfo/slice";
import type { EmsReferral } from "@/features/emergency/triage/emsInfo/types";

/** emsInfo saga — UC-TRI-01 / Jira UD2-8. API 호출은 여기서만 (가이드 10.3) */
function* fetchEmsInfoSaga(action: PayloadAction<string | undefined>) {
  try {
    const items: EmsReferral[] = yield call(getEmsInfo, action.payload);
    yield put(fetchEmsInfoSuccess(items));
  } catch (err) {
    const message = err instanceof Error ? err.message : "EMS 정보 조회에 실패했습니다.";
    yield put(fetchEmsInfoFailure(message));
  }
}

export default function* emsInfoSaga() {
  yield takeLatest(fetchEmsInfoRequest.type, fetchEmsInfoSaga);
}
