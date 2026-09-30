import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { LabResultConfirmRequest } from "@/features/labimaging/labresult/types";
import type {
  PathologyResultCreateRequest,
  PathologyResultState,
  PathologyResultSummary,
  PathologyResultUpdateRequest,
} from "@/features/labimaging/pathologyresult/types";

/**
 * 병리검사결과 slice — UC-RST-03 (5차 Phase 4)
 *
 * ⚠ 첨부 File 객체는 액션 payload 로 saga 까지만 넘기고 state 에는 넣지 않는다(직렬화되지 않는 값).
 *   store.ts 의 serializableCheck 예외 목록은 직원 사진(emp/*) 액션만 등록돼 있어, 개발 모드에서
 *   직렬화 경고가 콘솔에 뜬다(영상 업로드 액션도 같다). 동작에는 영향이 없다.
 *   store.ts 는 리더 관리 파일이라 여기서 고치지 않고 예외 등록을 요청 목록에 올린다(05_프론트리더_등록요청).
 */
const initialState: PathologyResultState = {
  results: [],
  loading: false,
  loadError: "",
  submitting: false,
  submitError: "",
  lastSubmitted: null,
};

const pathologyResultSlice = createSlice({
  name: "labImaging/pathologyresult",
  initialState,
  reducers: {
    fetchPathologyResultsRequest: {
      reducer(state) {
        state.loading = true;
        state.loadError = "";
      },
      prepare(receptionNo: string) {
        return { payload: receptionNo };
      },
    },
    fetchPathologyResultsSuccess(state, action: PayloadAction<PathologyResultSummary[]>) {
      state.loading = false;
      state.results = action.payload;
    },
    fetchPathologyResultsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.loadError = action.payload;
    },

    createPathologyResultRequest: {
      reducer(state) {
        state.submitting = true;
        state.submitError = "";
      },
      prepare(request: PathologyResultCreateRequest, file: File | null, receptionNo: string) {
        return { payload: { request, file, receptionNo } };
      },
    },
    updatePathologyResultRequest: {
      reducer(state) {
        state.submitting = true;
        state.submitError = "";
      },
      prepare(pathologyResultId: string, request: PathologyResultUpdateRequest, file: File | null, receptionNo: string) {
        return { payload: { pathologyResultId, request, file, receptionNo } };
      },
    },
    confirmPathologyResultRequest: {
      reducer(state) {
        state.submitting = true;
        state.submitError = "";
      },
      prepare(pathologyResultId: string, request: LabResultConfirmRequest, receptionNo: string) {
        return { payload: { pathologyResultId, request, receptionNo } };
      },
    },
    submitPathologyResultSuccess(state, action: PayloadAction<PathologyResultSummary>) {
      state.submitting = false;
      state.submitError = "";
      state.lastSubmitted = action.payload;
    },
    submitPathologyResultFailure(state, action: PayloadAction<string>) {
      state.submitting = false;
      state.submitError = action.payload;
    },

    resetPathologyResultState(state) {
      state.results = [];
      state.loadError = "";
      state.submitError = "";
      state.lastSubmitted = null;
    },
  },
});

export const {
  fetchPathologyResultsRequest,
  fetchPathologyResultsSuccess,
  fetchPathologyResultsFailure,
  createPathologyResultRequest,
  updatePathologyResultRequest,
  confirmPathologyResultRequest,
  submitPathologyResultSuccess,
  submitPathologyResultFailure,
  resetPathologyResultState,
} = pathologyResultSlice.actions;

export default pathologyResultSlice.reducer;

type Root = { labImaging: { pathologyresult: PathologyResultState } };

export const selectPathologyResults = (s: Root) => s.labImaging.pathologyresult.results;
export const selectPathologyLoading = (s: Root) => s.labImaging.pathologyresult.loading;
export const selectPathologyLoadError = (s: Root) => s.labImaging.pathologyresult.loadError;
export const selectPathologySubmitting = (s: Root) => s.labImaging.pathologyresult.submitting;
export const selectPathologySubmitError = (s: Root) => s.labImaging.pathologyresult.submitError;
export const selectLastSubmittedPathologyResult = (s: Root) => s.labImaging.pathologyresult.lastSubmitted;
