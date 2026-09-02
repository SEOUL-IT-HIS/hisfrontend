import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  createImageSchedule,
  rescheduleImageSchedule,
} from "@/features/labimaging/imagingschedule/api";
import {
  createImageScheduleFailure,
  createImageScheduleRequest,
  createImageScheduleSuccess,
  rescheduleImageScheduleRequest,
  rescheduleImageScheduleSuccess,
  rescheduleImageScheduleFailure,
} from "@/features/labimaging/imagingschedule/slice";
import type {
  ImageScheduleCreateRequest,
  ImageScheduleRescheduleRequest,
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

export default function* imageScheduleSaga() {
  yield takeLatest(createImageScheduleRequest.type, createImageScheduleSaga);
  yield takeLatest(
    rescheduleImageScheduleRequest.type,
    rescheduleImageScheduleSaga,
  );
}
