import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Disposition, DispositionCreateRequest, DispositionState } from "@/features/emergency/disposition/types";

/** disposition(퇴실 결정) slice — UC-DISP-01 */
const initialState: DispositionState = {
  byReceptionId: {},
  loading: false,
  error: "",
  submitting: false,
  submitError: "",
};

const dispositionSlice = createSlice({
  name: "emergency/disposition",
  initialState,
  reducers: {
    fetchDispositionsRequest: {
      reducer(state) {
        state.loading = true;
        state.error = "";
      },
      prepare(receptionNo: string) {
        return { payload: receptionNo };
      },
    },
    fetchDispositionsSuccess(state, action: PayloadAction<{ receptionNo: string; items: Disposition[] }>) {
      state.loading = false;
      state.error = "";
      const latest = action.payload.items[0];
      if (latest) {
        state.byReceptionId[action.payload.receptionNo] = latest;
      } else {
        delete state.byReceptionId[action.payload.receptionNo];
      }
    },
    fetchDispositionsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    createDispositionRequest: {
      reducer(state) {
        state.submitting = true;
        state.submitError = "";
      },
      prepare(request: DispositionCreateRequest) {
        return { payload: request };
      },
    },
    createDispositionSuccess(state, action: PayloadAction<Disposition>) {
      state.submitting = false;
      state.submitError = "";
      state.byReceptionId[action.payload.receptionId] = action.payload;
    },
    createDispositionFailure(state, action: PayloadAction<string>) {
      state.submitting = false;
      state.submitError = action.payload;
    },
  },
});

export const {
  fetchDispositionsRequest,
  fetchDispositionsSuccess,
  fetchDispositionsFailure,
  createDispositionRequest,
  createDispositionSuccess,
  createDispositionFailure,
} = dispositionSlice.actions;

export default dispositionSlice.reducer;

// ----- Selector (가이드 10.4) -----
type DispositionRoot = { emergency: { disposition: DispositionState } };

export const selectDispositionByReceptionId = (receptionNo: string) => (state: DispositionRoot) =>
  state.emergency.disposition.byReceptionId[receptionNo] ?? null;
/** 퇴실 처리가 끝난(DONE) 환자인지 — 최신 퇴실 결정이 알려준 단계 기준(결정이 없으면 false) */
export const selectIsDischarged = (receptionNo: string) => (state: DispositionRoot) =>
  state.emergency.disposition.byReceptionId[receptionNo]?.stage === "DONE";
export const selectDispositionSubmitting = (state: DispositionRoot) => state.emergency.disposition.submitting;
export const selectDispositionSubmitError = (state: DispositionRoot) => state.emergency.disposition.submitError;
export const selectDispositionLoading = (state: DispositionRoot) => state.emergency.disposition.loading;
export const selectDispositionError = (state: DispositionRoot) => state.emergency.disposition.error;
