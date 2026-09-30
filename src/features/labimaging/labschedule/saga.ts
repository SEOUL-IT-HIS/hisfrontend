import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import { 
    createLabSchedule, 
    rescheduleLabSchedule 
} from "@/features/labimaging/labschedule/api";
import {
  createLabScheduleFailure,
  createLabScheduleRequest,
  rescheduleLabScheduleRequest,
  createLabScheduleSuccess,
  rescheduleLabScheduleSuccess,
  rescheduleLabScheduleFailure,
} from "@/features/labimaging/labschedule/slice";
import type { 
    LabScheduleCreateRequest, 
    LabScheduleRescheduleRequest, 
    LabScheduleResponse 
} from "@/features/labimaging/labschedule/types";


function* createLabScheduleSaga(action: PayloadAction<LabScheduleCreateRequest>) {
  try {
    const response: LabScheduleResponse = yield call(
      createLabSchedule,
      action.payload,
    );
    yield put(createLabScheduleSuccess(response));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to register lab schedule.";
    yield put(createLabScheduleFailure(message));
  }
}

function* rescheduleLabScheduleSaga(action: PayloadAction<{ labReceptionId: string; request: LabScheduleRescheduleRequest }>) {
  try {
    const {labReceptionId, request} = action.payload;
    const response: LabScheduleResponse = yield call(
      rescheduleLabSchedule,
      labReceptionId,
      request,
    );
    yield put(rescheduleLabScheduleSuccess(response));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to reschedule lab schedule.";
    yield put(rescheduleLabScheduleFailure(message));
  }
}

export default function* labScheduleSaga() {
  yield takeLatest(createLabScheduleRequest.type, createLabScheduleSaga);
  yield takeLatest(rescheduleLabScheduleRequest.type, rescheduleLabScheduleSaga);
}
