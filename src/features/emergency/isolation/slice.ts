import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { IsolationAssessment, IsolationCreateRequest, IsolationState } from "@/features/emergency/isolation/types";

/** isolation(감염병 격리 관리) slice — UC-TRI-05 / Jira UD2-11 */
const initialState: IsolationState = {
  items: [],
  loading: false,
  error: "",
  searched: false,
  submitting: false,
  submitError: "",
};

const isolationSlice = createSlice({
  name: "emergency/isolation",
  initialState,
  reducers: {
    fetchIsolationsRequest: {
      reducer(state) {
        state.loading = true;
        state.error = "";
      },
      prepare(receptionNo: string) {
        return { payload: receptionNo };
      },
    },
    fetchIsolationsSuccess(state, action: PayloadAction<IsolationAssessment[]>) {
      state.loading = false;
      state.error = "";
      state.items = action.payload;
      state.searched = true;
    },
    fetchIsolationsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
      state.searched = true;
    },
    createIsolationRequest: {
      reducer(state) {
        state.submitting = true;
        state.submitError = "";
      },
      prepare(request: IsolationCreateRequest) {
        return { payload: request };
      },
    },
    releaseIsolationRequest: {
      reducer(state) {
        state.submitting = true;
        state.submitError = "";
      },
      prepare(id: string) {
        return { payload: id };
      },
    },
    isolationSubmitSuccess(state, action: PayloadAction<IsolationAssessment>) {
      state.submitting = false;
      state.submitError = "";
      const idx = state.items.findIndex((item) => item.id === action.payload.id);
      if (idx >= 0) {
        state.items[idx] = action.payload;
      } else {
        state.items = [...state.items, action.payload];
      }
    },
    isolationSubmitFailure(state, action: PayloadAction<string>) {
      state.submitting = false;
      state.submitError = action.payload;
    },
    resetIsolationSubmitError(state) {
      state.submitError = "";
    },
  },
});

export const {
  fetchIsolationsRequest,
  fetchIsolationsSuccess,
  fetchIsolationsFailure,
  createIsolationRequest,
  releaseIsolationRequest,
  isolationSubmitSuccess,
  isolationSubmitFailure,
  resetIsolationSubmitError,
} = isolationSlice.actions;

export default isolationSlice.reducer;

// ----- Selector (가이드 10.4) -----
type IsolationRoot = { emergency: { isolation: IsolationState } };

export const selectIsolationItems = (state: IsolationRoot) => state.emergency.isolation.items;
export const selectIsolationLoading = (state: IsolationRoot) => state.emergency.isolation.loading;
export const selectIsolationError = (state: IsolationRoot) => state.emergency.isolation.error;
export const selectIsolationSearched = (state: IsolationRoot) => state.emergency.isolation.searched;
export const selectIsolationSubmitting = (state: IsolationRoot) => state.emergency.isolation.submitting;
export const selectIsolationSubmitError = (state: IsolationRoot) => state.emergency.isolation.submitError;
