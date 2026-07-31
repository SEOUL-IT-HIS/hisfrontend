import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createImageOrder } from "@/features/labimaging/imagingacquisition/api";
import {
  createImageOrderFailure,
  createImageOrderRequest,
  createImageOrderSuccess,
} from "@/features/labimaging/imagingacquisition/slice";
import type {
  ImageOrderCreateRequest,
  ImageOrderCreateResponse,
} from "@/features/labimaging/imagingacquisition/types";

/**
 * imagingAcquisition saga (labspecimen 과 동일 패턴)
 * - API 호출은 여기서만 (가이드 10.3)
 * - 흐름: createImageOrderRequest → createImageOrder → Success / Failure
 */
function* createImageOrderSaga(action: PayloadAction<ImageOrderCreateRequest>) {
  try {
    const response: ImageOrderCreateResponse = yield call(
      createImageOrder,
      action.payload,
    );
    yield put(createImageOrderSuccess(response));
  } catch (err) {
    // 중복 오더(LAB008) 등 업무 실패도 실패 메시지로 처리한다. (요청서 1.2)
    const message =
      err instanceof Error ? err.message : "영상 오더 접수에 실패했습니다.";
    yield put(createImageOrderFailure(message));
  }
}

/** 영상 오더 접수 요청을 감시한다 (최신 요청만 처리) */
export default function* imagingAcquisitionSaga() {
  yield takeLatest(createImageOrderRequest.type, createImageOrderSaga);
}
