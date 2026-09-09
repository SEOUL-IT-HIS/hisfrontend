import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  ImageScheduleItem,
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

  items: [],
  itemsLoading: false,
  itemsError: "",
};

const imageScheduleSlice = createSlice({
  name: "labImaging/imagingschedule",
  initialState,
  reducers: {
    // ---------- 접수의 촬영항목 + 일정 목록 조회 ----------
    fetchImageScheduleItemsRequest: {
      reducer(state) {
        state.itemsLoading = true;
        state.itemsError = "";
      },
      prepare(receptionNo: string) {
        return { payload: receptionNo };
      },
    },
    fetchImageScheduleItemsSuccess(
      state,
      action: PayloadAction<ImageScheduleItem[]>,
    ) {
      state.itemsLoading = false;
      state.items = action.payload;
    },
    fetchImageScheduleItemsFailure(state, action: PayloadAction<string>) {
      state.itemsLoading = false;
      state.itemsError = action.payload;
    },

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

    /** 다른 접수를 고르면 이전 접수의 항목 목록이나 오류가 남아 있으면 안 된다. */
    resetImageScheduleState(state) {
      state.items = [];
      state.itemsError = "";
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
  fetchImageScheduleItemsRequest,
  fetchImageScheduleItemsSuccess,
  fetchImageScheduleItemsFailure,
  resetImageScheduleState,
} = imageScheduleSlice.actions;

export default imageScheduleSlice.reducer;

type ImageScheduleRoot = { labImaging: { imagingschedule: ImageScheduleState } };

export const selectImageScheduleCreating = (s: ImageScheduleRoot) =>
  s.labImaging.imagingschedule.creating;
export const selectImageScheduleCreateError = (s: ImageScheduleRoot) =>
  s.labImaging.imagingschedule.createError;
export const selectLastCreatedImageSchedule = (s: ImageScheduleRoot) =>
  s.labImaging.imagingschedule.lastCreated;

export const selectImageScheduleItems = (s: ImageScheduleRoot) =>
  s.labImaging.imagingschedule.items;
export const selectImageScheduleItemsLoading = (s: ImageScheduleRoot) =>
  s.labImaging.imagingschedule.itemsLoading;
export const selectImageScheduleItemsError = (s: ImageScheduleRoot) =>
  s.labImaging.imagingschedule.itemsError;
