import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  ImageScheduleResponse,
  ImageScheduleState,
  ImageScheduleCreateRequest,
  ImageScheduleRescheduleRequest,
} from "@/features/labimaging/imagingschedule/types";

/** imagingSchedule slice — labschedule 와 동일 패턴 (create + reschedule). */
const initialState: ImageScheduleState = {
  creating: false,
  createError: "",
  lastCreated: null,
};

const imageScheduleSlice = createSlice({
  name: "labImaging/imagingschedule",
  initialState,
  reducers: {
    createImageScheduleRequest: {
      reducer(state) {
        state.creating = true;
        state.createError = "";
      },
      prepare(request: ImageScheduleCreateRequest) {
        return { payload: request };
      },
    },
    createImageScheduleSuccess(
      state,
      action: PayloadAction<ImageScheduleResponse>,
    ) {
      state.creating = false;
      state.createError = "";
      state.lastCreated = action.payload;
    },
    createImageScheduleFailure(state, action: PayloadAction<string>) {
      state.creating = false;
      state.createError = action.payload;
    },
    resetImageScheduleResult(state) {
      state.createError = "";
      state.lastCreated = null;
    },

    // 재등록 payload 는 { imageReceptionId(경로), request(body) } 중첩 구조로 담는다.
    rescheduleImageScheduleRequest: {
      reducer(state) {
        state.creating = true;
        state.createError = "";
      },
      prepare(imageReceptionId: string, request: ImageScheduleRescheduleRequest) {
        return { payload: { imageReceptionId, request } };
      },
    },
    rescheduleImageScheduleSuccess(
      state,
      action: PayloadAction<ImageScheduleResponse>,
    ) {
      state.creating = false;
      state.createError = "";
      state.lastCreated = action.payload;
    },
    rescheduleImageScheduleFailure(state, action: PayloadAction<string>) {
      state.creating = false;
      state.createError = action.payload;
    },
  },
});

export const {
  createImageScheduleRequest,
  createImageScheduleSuccess,
  createImageScheduleFailure,
  resetImageScheduleResult,
  rescheduleImageScheduleRequest,
  rescheduleImageScheduleSuccess,
  rescheduleImageScheduleFailure,
} = imageScheduleSlice.actions;

export default imageScheduleSlice.reducer;

type ImageScheduleRoot = { labImaging: { imagingschedule: ImageScheduleState } };

export const selectImageScheduleCreating = (s: ImageScheduleRoot) =>
  s.labImaging.imagingschedule.creating;
export const selectImageScheduleCreateError = (s: ImageScheduleRoot) =>
  s.labImaging.imagingschedule.createError;
export const selectLastCreatedImageSchedule = (s: ImageScheduleRoot) =>
  s.labImaging.imagingschedule.lastCreated;
