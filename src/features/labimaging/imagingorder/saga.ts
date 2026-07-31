import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  createImageOrder,
  fetchImageReceptions,
  fetchImageReceptionByNo,
} from "@/features/labimaging/imagingorder/api";
import {
  createImageOrderFailure,
  createImageOrderRequest,
  createImageOrderSuccess,
  fetchImageReceptionsRequest,
  fetchImageReceptionsSuccess,
  fetchImageReceptionsFailure,
  fetchImageReceptionByNoRequest,
  fetchImageReceptionByNoSuccess,
  fetchImageReceptionByNoFailure,
} from "@/features/labimaging/imagingorder/slice";
import type {
  ImageOrderCreateRequest,
  ImageOrderCreateResponse,
  ImageReceptionSummary,
} from "@/features/labimaging/imagingorder/types";

/** imagingOrder saga (laborder 과 동일 패턴) — API 호출은 여기서만 (가이드 10.3). */
function* createImageOrderSaga(action: PayloadAction<ImageOrderCreateRequest>) {
  try {
    const response: ImageOrderCreateResponse = yield call(
      createImageOrder,
      action.payload,
    );
    yield put(createImageOrderSuccess(response));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "영상 오더 접수에 실패했습니다.";
    yield put(createImageOrderFailure(message));
  }
}

function* fetchImageReceptionsSaga() {
  try {
    const list: ImageReceptionSummary[] = yield call(fetchImageReceptions);
    yield put(fetchImageReceptionsSuccess(list));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "접수 목록 조회에 실패했습니다.";
    yield put(fetchImageReceptionsFailure(message));
  }
}

function* fetchImageReceptionByNoSaga(action: PayloadAction<string>) {
  try {
    const reception: ImageReceptionSummary = yield call(
      fetchImageReceptionByNo,
      action.payload,
    );
    yield put(fetchImageReceptionByNoSuccess(reception));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "접수 조회에 실패했습니다.";
    yield put(fetchImageReceptionByNoFailure(message));
  }
}

export default function* imageOrderSaga() {
  yield takeLatest(createImageOrderRequest.type, createImageOrderSaga);
  yield takeLatest(fetchImageReceptionsRequest.type, fetchImageReceptionsSaga);
  yield takeLatest(
    fetchImageReceptionByNoRequest.type,
    fetchImageReceptionByNoSaga,
  );
}
