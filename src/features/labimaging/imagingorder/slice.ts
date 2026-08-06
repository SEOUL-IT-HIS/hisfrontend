import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  ImageOrderCreateRequest,
  ImageOrderCreateResponse,
  ImageOrderState,
  ImageReceptionSummary,
} from "@/features/labimaging/imagingorder/types";

/**
 * imagingOrder(영상 오더 접수 + 접수 조회) slice — laborder 와 동일 패턴.
 * createSlice name = "labImaging/imagingorder"
 */
const initialState: ImageOrderState = {
  creating: false,
  createError: "",
  lastCreated: null,

  receptions: [],
  receptionsLoading: false,
  receptionsError: "",

  selectedReception: null,
  receptionLoading: false,
  receptionError: "",
};

const imagingOrderSlice = createSlice({
  name: "labImaging/imagingorder",
  initialState,
  reducers: {
    // ---------- 접수 생성 ----------
    createImageOrderRequest: {
      reducer(state) {
        state.creating = true;
        state.createError = "";
      },
      prepare(request: ImageOrderCreateRequest) {
        return { payload: request };
      },
    },
    createImageOrderSuccess(
      state,
      action: PayloadAction<ImageOrderCreateResponse>,
    ) {
      state.creating = false;
      state.createError = "";
      state.lastCreated = action.payload;
    },
    createImageOrderFailure(state, action: PayloadAction<string>) {
      state.creating = false;
      state.createError = action.payload;
    },
    resetImageOrderResult(state) {
      state.createError = "";
      state.lastCreated = null;
    },

    // ---------- 접수 목록(미일정) 조회 ----------
    fetchImageReceptionsRequest(state) {
      state.receptionsLoading = true;
      state.receptionsError = "";
    },
    fetchImageReceptionsSuccess(
      state,
      action: PayloadAction<ImageReceptionSummary[]>,
    ) {
      state.receptionsLoading = false;
      state.receptions = action.payload;
    },
    fetchImageReceptionsFailure(state, action: PayloadAction<string>) {
      state.receptionsLoading = false;
      state.receptionsError = action.payload;
    },

    // ---------- 접수 단건 조회 ----------
    fetchImageReceptionByNoRequest: {
      reducer(state) {
        state.receptionLoading = true;
        state.receptionError = "";
        state.selectedReception = null;
      },
      prepare(receptionNo: string) {
        return { payload: receptionNo };
      },
    },
    fetchImageReceptionByNoSuccess(
      state,
      action: PayloadAction<ImageReceptionSummary>,
    ) {
      state.receptionLoading = false;
      state.selectedReception = action.payload;
    },
    fetchImageReceptionByNoFailure(state, action: PayloadAction<string>) {
      state.receptionLoading = false;
      state.receptionError = action.payload;
    },

    selectImageReception(state, action: PayloadAction<ImageReceptionSummary>) {
      state.selectedReception = action.payload;
      state.receptionError = "";
    },
    clearSelectedImageReception(state) {
      state.selectedReception = null;
      state.receptionError = "";
    },
  },
});

export const {
  createImageOrderRequest,
  createImageOrderSuccess,
  createImageOrderFailure,
  resetImageOrderResult,
  fetchImageReceptionsRequest,
  fetchImageReceptionsSuccess,
  fetchImageReceptionsFailure,
  fetchImageReceptionByNoRequest,
  fetchImageReceptionByNoSuccess,
  fetchImageReceptionByNoFailure,
  selectImageReception,
  clearSelectedImageReception,
} = imagingOrderSlice.actions;

export default imagingOrderSlice.reducer;

// ----- Selector (가이드 10.4) -----
type ImageOrderRoot = { labImaging: { imagingorder: ImageOrderState } };

export const selectImageOrderCreating = (s: ImageOrderRoot) =>
  s.labImaging.imagingorder.creating;
export const selectImageOrderCreateError = (s: ImageOrderRoot) =>
  s.labImaging.imagingorder.createError;
export const selectLastCreatedImageOrder = (s: ImageOrderRoot) =>
  s.labImaging.imagingorder.lastCreated;

export const selectImageReceptions = (s: ImageOrderRoot) =>
  s.labImaging.imagingorder.receptions;
export const selectImageReceptionsLoading = (s: ImageOrderRoot) =>
  s.labImaging.imagingorder.receptionsLoading;
export const selectImageReceptionsError = (s: ImageOrderRoot) =>
  s.labImaging.imagingorder.receptionsError;

export const selectSelectedImageReception = (s: ImageOrderRoot) =>
  s.labImaging.imagingorder.selectedReception;
export const selectImageReceptionLoading = (s: ImageOrderRoot) =>
  s.labImaging.imagingorder.receptionLoading;
export const selectImageReceptionError = (s: ImageOrderRoot) =>
  s.labImaging.imagingorder.receptionError;
