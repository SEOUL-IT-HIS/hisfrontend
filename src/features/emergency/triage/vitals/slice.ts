import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { EwsRecord, VitalAssessmentCreateRequest, VitalsState } from "@/features/emergency/triage/vitals/types";

/** vitals(초기 환자상태 평가/활력징후) slice — UC-TRI-04 / Jira UD2-10 */
const initialState: VitalsState = {
  items: [],
  loading: false,
  error: "",
  searched: false,
  submitting: false,
  submitError: "",
};

const vitalsSlice = createSlice({
  name: "emergency/vitals",
  initialState,
  reducers: {
    fetchVitalsRequest: {
      reducer(state) {
        state.loading = true;
        state.error = "";
      },
      prepare(receptionNo: string) {
        return { payload: receptionNo };
      },
    },
    fetchVitalsSuccess(state, action: PayloadAction<EwsRecord[]>) {
      state.loading = false;
      state.error = "";
      state.items = action.payload;
      state.searched = true;
    },
    fetchVitalsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
      state.searched = true;
    },
    createVitalsRequest: {
      reducer(state) {
        state.submitting = true;
        state.submitError = "";
      },
      prepare(request: VitalAssessmentCreateRequest) {
        return { payload: request };
      },
    },
    createVitalsSuccess(state, action: PayloadAction<EwsRecord[]>) {
      state.submitting = false;
      state.submitError = "";
      state.items = [...state.items, ...action.payload];
    },
    createVitalsFailure(state, action: PayloadAction<string>) {
      state.submitting = false;
      state.submitError = action.payload;
    },
    resetVitalsSubmitError(state) {
      state.submitError = "";
    },
  },
});

export const {
  fetchVitalsRequest,
  fetchVitalsSuccess,
  fetchVitalsFailure,
  createVitalsRequest,
  createVitalsSuccess,
  createVitalsFailure,
  resetVitalsSubmitError,
} = vitalsSlice.actions;

export default vitalsSlice.reducer;

// ----- Selector (가이드 10.4) -----
type VitalsRoot = { emergency: { vitals: VitalsState } };

export const selectVitalsItems = (state: VitalsRoot) => state.emergency.vitals.items;
export const selectVitalsLoading = (state: VitalsRoot) => state.emergency.vitals.loading;
export const selectVitalsError = (state: VitalsRoot) => state.emergency.vitals.error;
export const selectVitalsSearched = (state: VitalsRoot) => state.emergency.vitals.searched;
export const selectVitalsSubmitting = (state: VitalsRoot) => state.emergency.vitals.submitting;
export const selectVitalsSubmitError = (state: VitalsRoot) => state.emergency.vitals.submitError;
