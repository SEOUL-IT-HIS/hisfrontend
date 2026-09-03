import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  ImageOrderCreateRequest,
  ImageOrderCreateResponse,
  ImageOrderState,
  ImageReceptionContext,
  ImageReceptionDetail,
  ImageReceptionSummary,
  ImageWorklistItem,
  ImageWorklistStatusFilter,
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
  selectedWorklistReceptionNo: "",

  worklist: [],
  worklistLoading: false,
  worklistError: "",

  exclusionSubmitting: false,
  exclusionError: "",
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

    // ---------- 워크리스트 행 선택 ----------
    /**
     * ⚠ 위 selectImageReception 과 다른 상태다. 합치지 않는다.
     *   그쪽은 "일정 화면으로 넘길 컨텍스트 객체"고, 이쪽은 "지금 목록에서 고른 행이 무엇인가"다.
     *   워크리스트는 목록이 갱신돼도 같은 행을 계속 잡고 있어야 하는데, 객체를 들고 있으면
     *   갱신된 목록의 새 객체와 참조가 달라져 선택이 풀린다. 그래서 접수번호만 들고
     *   화면이 목록에서 다시 찾아 쓴다. (검사 워크리스트와 같은 방식)
     */
    selectImageWorklistReception(state, action: PayloadAction<string>) {
      state.selectedWorklistReceptionNo = action.payload;
    },
    clearImageWorklistSelection(state) {
      state.selectedWorklistReceptionNo = "";
    },

    // ---------- 워크리스트 조회 ----------
    // payload = 필터("ALL"/"ACCEPTED"/"EXCLUDED"). saga 가 읽어 API 파라미터로 넘긴다.
    fetchImageWorklistRequest(
      state,
      _action: PayloadAction<ImageWorklistStatusFilter | undefined>,
    ) {
      state.worklistLoading = true;
      state.worklistError = "";
    },
    fetchImageWorklistSuccess(state, action: PayloadAction<ImageWorklistItem[]>) {
      state.worklistLoading = false;
      state.worklist = action.payload;
    },
    fetchImageWorklistFailure(state, action: PayloadAction<string>) {
      state.worklistLoading = false;
      state.worklistError = action.payload;
    },

    // ---------- 접수 제외 / 복구 ----------
    /**
     * ⚠ payload 에 현재 필터를 같이 싣는다.
     *   제외/복구에 성공하면 목록을 다시 불러와야 하는데, 어느 필터로 보고 있었는지를
     *   saga 가 알아야 같은 화면을 다시 그릴 수 있다. (검사 워크리스트와 같은 규약)
     */
    excludeImageReceptionRequest: {
      reducer(state) {
        state.exclusionSubmitting = true;
        state.exclusionError = "";
      },
      prepare(
        receptionNo: string,
        exclusionReason: string,
        filter: ImageWorklistStatusFilter,
      ) {
        return { payload: { receptionNo, exclusionReason, filter } };
      },
    },
    restoreImageReceptionRequest: {
      reducer(state) {
        state.exclusionSubmitting = true;
        state.exclusionError = "";
      },
      prepare(receptionNo: string, filter: ImageWorklistStatusFilter) {
        return { payload: { receptionNo, filter } };
      },
    },
    /** 제외·복구 공용 성공/실패. saga 가 어느 쪽이든 이 둘로 모은다. */
    imageExclusionSuccess(state) {
      state.exclusionSubmitting = false;
      state.exclusionError = "";
    },
    imageExclusionFailure(state, action: PayloadAction<string>) {
      state.exclusionSubmitting = false;
      state.exclusionError = action.payload;
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
  selectImageWorklistReception,
  clearImageWorklistSelection,
  fetchImageWorklistRequest,
  fetchImageWorklistSuccess,
  fetchImageWorklistFailure,
  excludeImageReceptionRequest,
  restoreImageReceptionRequest,
  imageExclusionSuccess,
  imageExclusionFailure,
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

/** 워크리스트에서 고른 행의 접수번호. 빈 문자열이면 선택 없음. */
export const selectSelectedImageWorklistReceptionNo = (s: ImageOrderRoot) =>
  s.labImaging.imagingorder.selectedWorklistReceptionNo;

export const selectImageWorklist = (s: ImageOrderRoot) =>
  s.labImaging.imagingorder.worklist;
export const selectImageWorklistLoading = (s: ImageOrderRoot) =>
  s.labImaging.imagingorder.worklistLoading;
export const selectImageWorklistError = (s: ImageOrderRoot) =>
  s.labImaging.imagingorder.worklistError;

export const selectImageExclusionSubmitting = (s: ImageOrderRoot) =>
  s.labImaging.imagingorder.exclusionSubmitting;
export const selectImageExclusionError = (s: ImageOrderRoot) =>
  s.labImaging.imagingorder.exclusionError;
