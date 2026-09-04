import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  createImageSchedule,
  fetchImageScheduleItems,
  rescheduleImageSchedule,
} from "@/features/labimaging/imagingschedule/api";
import {
  createImageScheduleFailure,
  createImageScheduleRequest,
  createImageScheduleSuccess,
  rescheduleImageScheduleRequest,
  rescheduleImageScheduleSuccess,
  rescheduleImageScheduleFailure,
  fetchImageScheduleItemsRequest,
  fetchImageScheduleItemsSuccess,
  fetchImageScheduleItemsFailure,
} from "@/features/labimaging/imagingschedule/slice";
import type {
  ImageScheduleCreateRequest,
  ImageScheduleRescheduleRequest,
  ImageScheduleItem,
  ImageScheduleResponse,
} from "@/features/labimaging/imagingschedule/types";

function* createImageScheduleSaga(
  action: PayloadAction<ImageScheduleCreateRequest>,
) {
  try {
    const response: ImageScheduleResponse = yield call(
      createImageSchedule,
      action.payload,
    );
    yield put(createImageScheduleSuccess(response));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to register imaging schedule.";
    yield put(createImageScheduleFailure(message));
  }
}

function* rescheduleImageScheduleSaga(
  action: PayloadAction<{
    imageReceptionId: string;
    request: ImageScheduleRescheduleRequest;
  }>,
) {
  try {
    const { imageReceptionId, request } = action.payload;
    const response: ImageScheduleResponse = yield call(
      rescheduleImageSchedule,
      imageReceptionId,
      request,
    );
    yield put(rescheduleImageScheduleSuccess(response));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to reschedule imaging schedule.";
    yield put(rescheduleImageScheduleFailure(message));
  }
}

/**
 * 접수의 촬영항목 + 최종 일정 목록을 불러온다.
 *
 * ⚠ 등록·재조정 뒤에도 이 조회를 다시 부른다. 방금 잡은 일정이 항목 줄에 바로 보여야
 *   담당자가 "몇 건 남았는지"를 알 수 있다. (검사결과 화면과 같은 구조)
 */
function* fetchImageScheduleItemsSaga(action: PayloadAction<string>) {
  try {
    const items: ImageScheduleItem[] = yield call(
      fetchImageScheduleItems,
      action.payload,
    );
    yield put(fetchImageScheduleItemsSuccess(items));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load imaging items.";
    yield put(fetchImageScheduleItemsFailure(message));
  }
}

export default function* imageScheduleSaga() {
  yield takeLatest(fetchImageScheduleItemsRequest.type, fetchImageScheduleItemsSaga);
  yield takeLatest(createImageScheduleRequest.type, createImageScheduleSaga);
  yield takeLatest(
    rescheduleImageScheduleRequest.type,
    rescheduleImageScheduleSaga,
  );
}
