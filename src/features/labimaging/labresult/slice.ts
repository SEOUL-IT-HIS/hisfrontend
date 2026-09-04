import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  LabResultConfirmRequest,
  LabResultCreateRequest,
  LabResultItem,
  LabResultState,
  LabResultSummary,
  LabResultUpdateRequest,
} from "@/features/labimaging/labresult/types";

/**
 * labresult(검사결과 등록/수정/확정) slice
 * - 상태만 관리하고 API 호출은 하지 않는다 → saga 가 담당 (가이드 10.3)
 *
 * ⚠ 등록·수정·확정이 submitting / submitError / lastSubmitted 를 공유한다.
 *   셋은 같은 폼에서 한 번에 하나만 일어나고, 끝나면 항상 같은 일(목록 새로고침)을 한다.
 *   상태를 셋으로 나누면 화면이 "지금 뭐가 진행 중인지"를 세 번 물어봐야 한다.
 *   (검체는 등록과 판정이 서로 다른 폼이라 나눠 뒀다 — 그쪽과 다른 이유가 이것이다)
 */
const initialState: LabResultState = {
  items: [],
  itemsLoading: false,
  itemsError: "",

  submitting: false,
  submitError: "",
  lastSubmitted: null,
};

const labResultSlice = createSlice({
  name: "labImaging/labresult",
  initialState,
  reducers: {
    // ---------- 접수의 검사항목 + 결과 목록 조회 ----------
    fetchLabResultItemsRequest: {
      reducer(state) {
        state.itemsLoading = true;
        state.itemsError = "";
      },
      prepare(receptionNo: string) {
        return { payload: receptionNo };
      },
    },
    fetchLabResultItemsSuccess(state, action: PayloadAction<LabResultItem[]>) {
      state.itemsLoading = false;
      state.items = action.payload;
    },
    fetchLabResultItemsFailure(state, action: PayloadAction<string>) {
      state.itemsLoading = false;
      state.itemsError = action.payload;
    },

    /*
     * ⚠ 아래 세 액션 모두 payload 에 receptionNo 를 같이 싣는다.
     *   성공하면 그 접수의 항목 목록을 다시 불러와야 하는데,
     *   요청은 항목ID·결과ID로 하고 목록 조회는 접수번호로 하기 때문이다.
     *   (검체 등록/판정과 같은 이유 — labspecimen/slice.ts 참고)
     */

    // ---------- 결과 등록 ----------
    createLabResultRequest: {
      reducer(state) {
        state.submitting = true;
        state.submitError = "";
      },
      prepare(request: LabResultCreateRequest, receptionNo: string) {
        return { payload: { request, receptionNo } };
      },
    },

    // ---------- 결과 수정 (확정 전만) ----------
    updateLabResultRequest: {
      reducer(state) {
        state.submitting = true;
        state.submitError = "";
      },
      prepare(
        labResultId: string,
        request: LabResultUpdateRequest,
        receptionNo: string,
      ) {
        return { payload: { labResultId, request, receptionNo } };
      },
    },

    // ---------- 결과 확정 ----------
    confirmLabResultRequest: {
      reducer(state) {
        state.submitting = true;
        state.submitError = "";
      },
      prepare(
        labResultId: string,
        request: LabResultConfirmRequest,
        receptionNo: string,
      ) {
        return { payload: { labResultId, request, receptionNo } };
      },
    },

    /** 등록·수정·확정 공용 성공/실패. saga 가 어느 쪽이든 이 둘로 모은다. */
    submitLabResultSuccess(state, action: PayloadAction<LabResultSummary>) {
      state.submitting = false;
      state.submitError = "";
      state.lastSubmitted = action.payload;
    },
    submitLabResultFailure(state, action: PayloadAction<string>) {
      state.submitting = false;
      state.submitError = action.payload;
    },

    /** 다른 접수를 고르면 이전 접수의 목록이나 결과·오류가 남아 있으면 안 된다. */
    resetLabResultState(state) {
      state.items = [];
      state.itemsError = "";
      state.submitError = "";
      state.lastSubmitted = null;
    },
  },
});

export const {
  fetchLabResultItemsRequest,
  fetchLabResultItemsSuccess,
  fetchLabResultItemsFailure,
  createLabResultRequest,
  updateLabResultRequest,
  confirmLabResultRequest,
  submitLabResultSuccess,
  submitLabResultFailure,
  resetLabResultState,
} = labResultSlice.actions;

export default labResultSlice.reducer;

// ----- Selector (가이드 10.4: 컴포넌트에서 state.xxx.yyy 깊게 접근 금지) -----
type LabResultRoot = { labImaging: { labresult: LabResultState } };

export const selectLabResultItems = (s: LabResultRoot) =>
  s.labImaging.labresult.items;
export const selectLabResultItemsLoading = (s: LabResultRoot) =>
  s.labImaging.labresult.itemsLoading;
export const selectLabResultItemsError = (s: LabResultRoot) =>
  s.labImaging.labresult.itemsError;

export const selectLabResultSubmitting = (s: LabResultRoot) =>
  s.labImaging.labresult.submitting;
export const selectLabResultSubmitError = (s: LabResultRoot) =>
  s.labImaging.labresult.submitError;
export const selectLastSubmittedLabResult = (s: LabResultRoot) =>
  s.labImaging.labresult.lastSubmitted;
