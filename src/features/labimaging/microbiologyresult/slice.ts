import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SpecimenSummary } from "@/features/labimaging/labspecimen/types";
import type { LabResultConfirmRequest } from "@/features/labimaging/labresult/types";
import type {
  MicrobiologyResultCreateRequest,
  MicrobiologyResultState,
  MicrobiologyResultSummary,
  MicrobiologyResultUpdateRequest,
} from "@/features/labimaging/microbiologyresult/types";

/**
 * 미생물검사결과 slice — UC-RST-02 (5차 Phase 3)
 *
 * ⚠ labresult slice 와 나눴다. 결과가 들어가는 테이블·API·폼 모양이 다르고, 한 slice 에 섞으면
 *   일반검사 목록 갱신이 미생물 폼 상태를 지우는(또는 반대) 일이 생긴다.
 * ⚠ root 가 아니라 labimaging 공통 slice(features/labimaging/common/slice.ts)에 붙인다(수정 권한 규칙).
 */
const initialState: MicrobiologyResultState = {
  results: [],
  specimens: [],
  loading: false,
  loadError: "",
  submitting: false,
  submitError: "",
  lastSubmitted: null,
};

const microbiologyResultSlice = createSlice({
  name: "labImaging/microbiologyresult",
  initialState,
  reducers: {
    // ---------- 접수의 미생물 결과 + 검체 목록 ----------
    fetchMicrobiologyResultsRequest: {
      reducer(state) {
        state.loading = true;
        state.loadError = "";
      },
      prepare(receptionNo: string) {
        return { payload: receptionNo };
      },
    },
    fetchMicrobiologyResultsSuccess(
      state,
      action: PayloadAction<{ results: MicrobiologyResultSummary[]; specimens: SpecimenSummary[] }>,
    ) {
      state.loading = false;
      state.results = action.payload.results;
      state.specimens = action.payload.specimens;
    },
    fetchMicrobiologyResultsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.loadError = action.payload;
    },

    // ---------- 등록 / 수정 / 확정 ----------
    createMicrobiologyResultRequest: {
      reducer(state) {
        state.submitting = true;
        state.submitError = "";
      },
      prepare(request: MicrobiologyResultCreateRequest, receptionNo: string) {
        return { payload: { request, receptionNo } };
      },
    },
    updateMicrobiologyResultRequest: {
      reducer(state) {
        state.submitting = true;
        state.submitError = "";
      },
      prepare(microbiologyResultId: string, request: MicrobiologyResultUpdateRequest, receptionNo: string) {
        return { payload: { microbiologyResultId, request, receptionNo } };
      },
    },
    confirmMicrobiologyResultRequest: {
      reducer(state) {
        state.submitting = true;
        state.submitError = "";
      },
      prepare(microbiologyResultId: string, request: LabResultConfirmRequest, receptionNo: string) {
        return { payload: { microbiologyResultId, request, receptionNo } };
      },
    },
    submitMicrobiologyResultSuccess(state, action: PayloadAction<MicrobiologyResultSummary>) {
      state.submitting = false;
      state.submitError = "";
      state.lastSubmitted = action.payload;
    },
    submitMicrobiologyResultFailure(state, action: PayloadAction<string>) {
      state.submitting = false;
      state.submitError = action.payload;
    },

    resetMicrobiologyResultState(state) {
      state.results = [];
      state.specimens = [];
      state.loadError = "";
      state.submitError = "";
      state.lastSubmitted = null;
    },
  },
});

export const {
  fetchMicrobiologyResultsRequest,
  fetchMicrobiologyResultsSuccess,
  fetchMicrobiologyResultsFailure,
  createMicrobiologyResultRequest,
  updateMicrobiologyResultRequest,
  confirmMicrobiologyResultRequest,
  submitMicrobiologyResultSuccess,
  submitMicrobiologyResultFailure,
  resetMicrobiologyResultState,
} = microbiologyResultSlice.actions;

export default microbiologyResultSlice.reducer;

// ----- Selector (가이드 10.4) -----
type Root = { labImaging: { microbiologyresult: MicrobiologyResultState } };

export const selectMicrobiologyResults = (s: Root) => s.labImaging.microbiologyresult.results;
export const selectMicrobiologySpecimens = (s: Root) => s.labImaging.microbiologyresult.specimens;
export const selectMicrobiologyLoading = (s: Root) => s.labImaging.microbiologyresult.loading;
export const selectMicrobiologyLoadError = (s: Root) => s.labImaging.microbiologyresult.loadError;
export const selectMicrobiologySubmitting = (s: Root) => s.labImaging.microbiologyresult.submitting;
export const selectMicrobiologySubmitError = (s: Root) => s.labImaging.microbiologyresult.submitError;
export const selectLastSubmittedMicrobiologyResult = (s: Root) =>
  s.labImaging.microbiologyresult.lastSubmitted;
