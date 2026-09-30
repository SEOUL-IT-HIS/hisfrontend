import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  ImageReadingAssignRequest,
  ImageReadingConfirmRequest,
  ImageReadingFindingsRequest,
  ImageReadingState,
  ImageReadingSummary,
} from "@/features/labimaging/imaginginterpretation/types";

/**
 * imaginginterpretation(영상판독) slice
 * - 상태만 관리하고 API 호출은 하지 않는다 → saga 가 담당 (가이드 10.3)
 *
 * ⚠ 배정·소견저장·확정이 submitting/submitError/lastSubmitted 를 공유한다.
 *   셋은 같은 상세 화면에서 한 번에 하나만 일어나고, 끝나면 항상 같은 일(판독 상세 새로고침)을
 *   한다. 상태를 셋으로 나누면 화면이 "지금 뭐가 진행 중인지"를 세 번 물어봐야 한다.
 *   (LabResultState 와 같은 이유)
 */
const initialState: ImageReadingState = {
  worklist: [],
  worklistLoading: false,
  worklistError: "",

  detail: null,
  detailLoading: false,
  detailError: "",
  loadedImageOrderItemId: null,

  submitting: false,
  submitError: "",
  lastSubmitted: null,
};

const imageReadingSlice = createSlice({
  name: "labImaging/imaginginterpretation",
  initialState,
  reducers: {
    // ---------- 판독 워크리스트 조회 ----------
    fetchReadingWorklistRequest(state) {
      state.worklistLoading = true;
      state.worklistError = "";
    },
    fetchReadingWorklistSuccess(state, action: PayloadAction<ImageReadingSummary[]>) {
      state.worklistLoading = false;
      state.worklist = action.payload;
    },
    fetchReadingWorklistFailure(state, action: PayloadAction<string>) {
      state.worklistLoading = false;
      state.worklistError = action.payload;
    },

    // ---------- 판독 상세 조회 (findOrCreate) ----------
    fetchReadingDetailRequest: {
      reducer(state) {
        state.detailLoading = true;
        state.detailError = "";
      },
      prepare(imageOrderItemId: string) {
        return { payload: imageOrderItemId };
      },
    },
    /**
     * ⚠ 상세와 함께 "어느 항목의 것인지"도 받는다.
     *   (ImageFileSlice.fetchImageFilesSuccess 와 같은 이유)
     */
    fetchReadingDetailSuccess(
      state,
      action: PayloadAction<{ imageOrderItemId: string; reading: ImageReadingSummary }>,
    ) {
      state.detailLoading = false;
      state.detail = action.payload.reading;
      state.loadedImageOrderItemId = action.payload.imageOrderItemId;
    },
    fetchReadingDetailFailure(state, action: PayloadAction<string>) {
      state.detailLoading = false;
      state.detailError = action.payload;
    },

    /*
     * ⚠ 아래 세 액션 모두 payload 에 imageOrderItemId 를 같이 싣는다.
     *   성공하면 그 항목의 판독 상세를 다시 불러와야 하는데, 요청은 판독ID로 하고
     *   상세 조회는 촬영항목ID로 하기 때문이다. (LabResultSlice 의 receptionNo 동반과 같은 이유)
     */

    // ---------- 담당자 배정 ----------
    assignReadingRequest: {
      reducer(state) {
        state.submitting = true;
        state.submitError = "";
      },
      prepare(
        imageReadingId: string,
        request: ImageReadingAssignRequest,
        imageOrderItemId: string,
      ) {
        return { payload: { imageReadingId, request, imageOrderItemId } };
      },
    },

    // ---------- 소견 입력/수정 (확정 전만) ----------
    updateFindingsRequest: {
      reducer(state) {
        state.submitting = true;
        state.submitError = "";
      },
      prepare(
        imageReadingId: string,
        request: ImageReadingFindingsRequest,
        imageOrderItemId: string,
      ) {
        return { payload: { imageReadingId, request, imageOrderItemId } };
      },
    },

    // ---------- 확정(전자서명) ----------
    confirmReadingRequest: {
      reducer(state) {
        state.submitting = true;
        state.submitError = "";
      },
      prepare(
        imageReadingId: string,
        request: ImageReadingConfirmRequest,
        imageOrderItemId: string,
      ) {
        return { payload: { imageReadingId, request, imageOrderItemId } };
      },
    },

    /** 배정·소견저장·확정 공용 성공/실패. saga 가 어느 쪽이든 이 둘로 모은다. */
    submitReadingSuccess(state, action: PayloadAction<ImageReadingSummary>) {
      state.submitting = false;
      state.submitError = "";
      state.lastSubmitted = action.payload;
    },
    submitReadingFailure(state, action: PayloadAction<string>) {
      state.submitting = false;
      state.submitError = action.payload;
    },

    /** 다른 촬영항목을 고르면 이전 항목의 상세·오류가 남아 있으면 안 된다. */
    resetImageReadingDetail(state) {
      state.detail = null;
      state.detailError = "";
      state.loadedImageOrderItemId = null;
      state.submitError = "";
      state.lastSubmitted = null;
    },
  },
});

export const {
  fetchReadingWorklistRequest,
  fetchReadingWorklistSuccess,
  fetchReadingWorklistFailure,
  fetchReadingDetailRequest,
  fetchReadingDetailSuccess,
  fetchReadingDetailFailure,
  assignReadingRequest,
  updateFindingsRequest,
  confirmReadingRequest,
  submitReadingSuccess,
  submitReadingFailure,
  resetImageReadingDetail,
} = imageReadingSlice.actions;

export default imageReadingSlice.reducer;

// ----- Selector (가이드 10.4: 컴포넌트에서 state.xxx.yyy 깊게 접근 금지) -----
type ImageReadingRoot = { labImaging: { imaginginterpretation: ImageReadingState } };

export const selectReadingWorklist = (s: ImageReadingRoot) =>
  s.labImaging.imaginginterpretation.worklist;
export const selectReadingWorklistLoading = (s: ImageReadingRoot) =>
  s.labImaging.imaginginterpretation.worklistLoading;
export const selectReadingWorklistError = (s: ImageReadingRoot) =>
  s.labImaging.imaginginterpretation.worklistError;

export const selectReadingDetail = (s: ImageReadingRoot) =>
  s.labImaging.imaginginterpretation.detail;
export const selectReadingDetailLoading = (s: ImageReadingRoot) =>
  s.labImaging.imaginginterpretation.detailLoading;
export const selectReadingDetailError = (s: ImageReadingRoot) =>
  s.labImaging.imaginginterpretation.detailError;
export const selectLoadedReadingItemId = (s: ImageReadingRoot) =>
  s.labImaging.imaginginterpretation.loadedImageOrderItemId;

export const selectReadingSubmitting = (s: ImageReadingRoot) =>
  s.labImaging.imaginginterpretation.submitting;
export const selectReadingSubmitError = (s: ImageReadingRoot) =>
  s.labImaging.imaginginterpretation.submitError;
export const selectLastSubmittedReading = (s: ImageReadingRoot) =>
  s.labImaging.imaginginterpretation.lastSubmitted;
