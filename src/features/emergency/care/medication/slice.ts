import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  MedicationAdministration,
  MedicationCreateRequest,
  MedicationState,
} from "@/features/emergency/care/medication/types";

/** medication(약물 투여 기록, MAR) slice — UC-CARE-04 */
const initialState: MedicationState = { items: [], loading: false, error: "", submitting: false, submitError: "" };

const medicationSlice = createSlice({
  name: "emergency/medication",
  initialState,
  reducers: {
    fetchMedicationsRequest: {
      reducer(state) {
        state.loading = true;
        state.error = "";
      },
      prepare(receptionId: string) {
        return { payload: receptionId };
      },
    },
    fetchMedicationsSuccess(state, action: PayloadAction<MedicationAdministration[]>) {
      state.loading = false;
      state.items = action.payload;
    },
    fetchMedicationsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    createMedicationRequest: {
      reducer(state) {
        state.submitting = true;
        state.submitError = "";
      },
      prepare(request: MedicationCreateRequest) {
        return { payload: request };
      },
    },
    createMedicationSuccess(state, action: PayloadAction<MedicationAdministration>) {
      state.submitting = false;
      // 투여 시각 순서를 유지한다(서버 정렬과 같음).
      state.items = [...state.items, action.payload].sort((a, b) => a.administeredAt.localeCompare(b.administeredAt));
    },
    createMedicationFailure(state, action: PayloadAction<string>) {
      state.submitting = false;
      state.submitError = action.payload;
    },
  },
});

export const {
  fetchMedicationsRequest,
  fetchMedicationsSuccess,
  fetchMedicationsFailure,
  createMedicationRequest,
  createMedicationSuccess,
  createMedicationFailure,
} = medicationSlice.actions;

export default medicationSlice.reducer;

type MedicationRoot = { emergency: { medication: MedicationState } };

export const selectMedicationItems = (state: MedicationRoot) => state.emergency.medication.items;
export const selectMedicationLoading = (state: MedicationRoot) => state.emergency.medication.loading;
export const selectMedicationError = (state: MedicationRoot) => state.emergency.medication.error;
export const selectMedicationSubmitting = (state: MedicationRoot) => state.emergency.medication.submitting;
export const selectMedicationSubmitError = (state: MedicationRoot) => state.emergency.medication.submitError;
