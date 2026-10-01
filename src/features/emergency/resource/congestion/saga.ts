import { call, put, takeLatest } from "redux-saga/effects";
import { getCongestion } from "@/features/emergency/resource/congestion/api";
import {
  fetchCongestionFailure,
  fetchCongestionRequest,
  fetchCongestionSuccess,
} from "@/features/emergency/resource/congestion/slice";
import type { Congestion } from "@/features/emergency/resource/congestion/types";
import { assignBedSuccess, releaseBedSuccess } from "@/features/emergency/resource/bed/slice";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function* fetchCongestionSaga() {
  try {
    const congestion: Congestion = yield call(getCongestion);
    yield put(fetchCongestionSuccess(congestion));
  } catch (err) {
    // 혼잡도 지표 조회에 실패했습니다.
    yield put(fetchCongestionFailure(errorMessage(err, "Failed to load congestion indicators.")));
  }
}

export default function* congestionSaga() {
  // 병상 배정/해제 직후에는 다음 폴링을 기다리지 않고 바로 다시 집계한다.
  yield takeLatest(
    [fetchCongestionRequest.type, assignBedSuccess.type, releaseBedSuccess.type],
    fetchCongestionSaga,
  );
}
