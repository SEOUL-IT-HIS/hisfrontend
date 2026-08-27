import { call, put, takeLatest } from "redux-saga/effects";
import { getAllCommonCodes } from "@/features/emergency/commonCode/api";
import {
  fetchAllCommonCodesFailure,
  fetchAllCommonCodesRequest,
  fetchAllCommonCodesSuccess,
} from "@/features/emergency/commonCode/slice";
import type { CommonCodeByGroup } from "@/features/emergency/commonCode/types";

function* fetchAllCommonCodesSaga() {
  try {
    const byGroupCode: CommonCodeByGroup = yield call(getAllCommonCodes);
    yield put(fetchAllCommonCodesSuccess(byGroupCode));
  } catch (err) {
    const message = err instanceof Error ? err.message : "공통코드 조회에 실패했습니다.";
    yield put(fetchAllCommonCodesFailure(message));
  }
}

export default function* commonCodeSaga() {
  yield takeLatest(fetchAllCommonCodesRequest.type, fetchAllCommonCodesSaga);
}
