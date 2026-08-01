import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  RiskScreening,
  RiskScreeningCreateRequest,
  RiskScreeningState,
} from "@/features/emergency/riskScreening/types";

/** riskScreening(패혈증-뇌졸중 위험도 스크리닝) slice — UC-TRI-06 / Jira UD2-12 */
const initialState: RiskScreeningState = {
  items: [],
  loading: false,
  error: "",
  searched: false,
  submitting: false,
  submitError: "",
};

const riskScreeningSlice = createSlice({
  name: "emergency/riskScreening",
  initialState,
  reducers: {
    fetchRiskScreeningsRequest: {
      reducer(state) {
        state.loading = true;
        state.error = "";
      },
      prepare(receptionNo: string) {
        return { payload: receptionNo };
      },
    },
    fetchRiskScreeningsSuccess(state, action: PayloadAction<RiskScreening[]>) {
      state.loading = false;
      state.error = "";
      state.items = action.payload;
      state.searched = true;
    },
    fetchRiskScreeningsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
      state.searched = true;
    },
    createRiskScreeningRequest: {
      reducer(state) {
        state.submitting = true;
        state.submitError = "";
      },
      prepare(request: RiskScreeningCreateRequest) {
        return { payload: request };
      },
    },
    riskScreeningSubmitSuccess(state, action: PayloadAction<RiskScreening>) {
      state.submitting = false;
      state.submitError = "";
      state.items = [...state.items, action.payload];
    },
    riskScreeningSubmitFailure(state, action: PayloadAction<string>) {
      state.submitting = false;
      state.submitError = action.payload;
    },
    resetRiskScreeningSubmitError(state) {
      state.submitError = "";
    },
  },
});

export const {
  fetchRiskScreeningsRequest,
  fetchRiskScreeningsSuccess,
  fetchRiskScreeningsFailure,
  createRiskScreeningRequest,
  riskScreeningSubmitSuccess,
  riskScreeningSubmitFailure,
  resetRiskScreeningSubmitError,
} = riskScreeningSlice.actions;

export default riskScreeningSlice.reducer;

// ----- Selector (가이드 10.4) -----
type RiskScreeningRoot = { emergency: { riskScreening: RiskScreeningState } };

export const selectRiskScreeningItems = (state: RiskScreeningRoot) => state.emergency.riskScreening.items;
export const selectRiskScreeningLoading = (state: RiskScreeningRoot) => state.emergency.riskScreening.loading;
export const selectRiskScreeningError = (state: RiskScreeningRoot) => state.emergency.riskScreening.error;
export const selectRiskScreeningSearched = (state: RiskScreeningRoot) => state.emergency.riskScreening.searched;
export const selectRiskScreeningSubmitting = (state: RiskScreeningRoot) => state.emergency.riskScreening.submitting;
export const selectRiskScreeningSubmitError = (state: RiskScreeningRoot) => state.emergency.riskScreening.submitError;
