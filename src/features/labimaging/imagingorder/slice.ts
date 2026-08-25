import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  ImageOrderCreateRequest,
  ImageOrderCreateResponse,
  ImageOrderState,
  ImageReceptionContext,
  ImageReceptionDetail,
  ImageReceptionSummary,
  ReceptionScheduledFilter,
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
  receptionDetail: null,
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
    // payload = 필터("ALL"/"Y"/"N"). saga 가 읽어 API 파라미터로 넘긴다.
    fetchImageReceptionsRequest(
      state,
      _action: PayloadAction<ReceptionScheduledFilter | undefined>,
    ) {
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
        state.receptionDetail = null;
      },
      prepare(receptionNo: string) {
        return { payload: receptionNo };
      },
    },
    fetchImageReceptionByNoSuccess(
      state,
      action: PayloadAction<ImageReceptionDetail>,
    ) {
      state.receptionLoading = false;
      state.receptionDetail = action.payload;
    },
    fetchImageReceptionByNoFailure(state, action: PayloadAction<string>) {
      state.receptionLoading = false;
      state.receptionError = action.payload;
    },

    selectImageReception(state, action: PayloadAction<ImageReceptionContext>) {
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

export const selectImageReceptionDetail = (s: ImageOrderRoot) =>
  s.labImaging.imagingorder.receptionDetail;
