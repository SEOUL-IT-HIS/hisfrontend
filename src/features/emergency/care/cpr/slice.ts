import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CprCreateRequest, CprEvent, CprState } from "@/features/emergency/care/cpr/types";

/** cpr(CPR 타임라인 기록) slice — UC-CARE-05 */
const initialState: CprState = { items: [], loading: false, error: "", submitting: false, submitError: "" };

const cprSlice = createSlice({
  name: "emergency/cpr",
  initialState,
  reducers: {
    fetchCprRequest: {
      reducer(state) {
        state.loading = true;
        state.error = "";
      },
      prepare(receptionId: string) {
        return { payload: receptionId };
      },
    },
    fetchCprSuccess(state, action: PayloadAction<CprEvent[]>) {
      state.loading = false;
      state.items = action.payload;
    },
    fetchCprFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    createCprRequest: {
      reducer(state) {
        state.submitting = true;
        state.submitError = "";
      },
      prepare(request: CprCreateRequest) {
        return { payload: request };
      },
    },
    createCprSuccess(state, action: PayloadAction<CprEvent>) {
      state.submitting = false;
      // 최신 시작 순(서버와 같음) — 새로 등록한 건이 맨 위.
      state.items = [action.payload, ...state.items];
    },
    createCprFailure(state, action: PayloadAction<string>) {
      state.submitting = false;
      state.submitError = action.payload;
    },
  },
});

export const {
  fetchCprRequest,
  fetchCprSuccess,
  fetchCprFailure,
  createCprRequest,
  createCprSuccess,
  createCprFailure,
} = cprSlice.actions;

export default cprSlice.reducer;

type CprRoot = { emergency: { cpr: CprState } };

export const selectCprItems = (state: CprRoot) => state.emergency.cpr.items;
export const selectCprLoading = (state: CprRoot) => state.emergency.cpr.loading;
export const selectCprError = (state: CprRoot) => state.emergency.cpr.error;
export const selectCprSubmitting = (state: CprRoot) => state.emergency.cpr.submitting;
export const selectCprSubmitError = (state: CprRoot) => state.emergency.cpr.submitError;
