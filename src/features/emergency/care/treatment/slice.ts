import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  TreatmentCreateRequest,
  TreatmentRecord,
  TreatmentState,
} from "@/features/emergency/care/treatment/types";

/** treatment(응급 처치 기록) slice — UC-CARE-03 */
const initialState: TreatmentState = { items: [], loading: false, error: "", submitting: false, submitError: "" };

const treatmentSlice = createSlice({
  name: "emergency/treatment",
  initialState,
  reducers: {
    fetchTreatmentsRequest: {
      reducer(state) {
        state.loading = true;
        state.error = "";
      },
      prepare(receptionId: string) {
        return { payload: receptionId };
      },
    },
    fetchTreatmentsSuccess(state, action: PayloadAction<TreatmentRecord[]>) {
      state.loading = false;
      state.items = action.payload;
    },
    fetchTreatmentsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    createTreatmentRequest: {
      reducer(state) {
        state.submitting = true;
        state.submitError = "";
      },
      prepare(request: TreatmentCreateRequest) {
        return { payload: request };
      },
    },
    createTreatmentSuccess(state, action: PayloadAction<TreatmentRecord>) {
      state.submitting = false;
      state.items = [...state.items, action.payload];
    },
    createTreatmentFailure(state, action: PayloadAction<string>) {
      state.submitting = false;
      state.submitError = action.payload;
    },
  },
});

export const {
  fetchTreatmentsRequest,
  fetchTreatmentsSuccess,
  fetchTreatmentsFailure,
  createTreatmentRequest,
  createTreatmentSuccess,
  createTreatmentFailure,
} = treatmentSlice.actions;

export default treatmentSlice.reducer;

type TreatmentRoot = { emergency: { treatment: TreatmentState } };

export const selectTreatmentItems = (state: TreatmentRoot) => state.emergency.treatment.items;
export const selectTreatmentLoading = (state: TreatmentRoot) => state.emergency.treatment.loading;
export const selectTreatmentError = (state: TreatmentRoot) => state.emergency.treatment.error;
export const selectTreatmentSubmitting = (state: TreatmentRoot) => state.emergency.treatment.submitting;
export const selectTreatmentSubmitError = (state: TreatmentRoot) => state.emergency.treatment.submitError;
