import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/store/store";
import type { PatientSearchItem, PatientSearchQuery } from "./types";

type PatientManagementState = {
  results: PatientSearchItem[];
  loading: boolean;
  error: string | null;
};

const initialState: PatientManagementState = {
  results: [],
  loading: false,
  error: null,
};

const patientManagementSlice = createSlice({
  name: "reception/patientmanagement",
  initialState,
  reducers: {
    searchPatientsRequest: {
      reducer(state) {
        state.loading = true;
        state.error = null;
      },
      prepare(query: PatientSearchQuery) {
        return { payload: query };
      },
    },
    searchPatientsSuccess(state, action: PayloadAction<PatientSearchItem[]>) {
      state.loading = false;
      state.results = action.payload;
    },
    searchPatientsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    clearPatientSearch(state) {
      state.results = [];
      state.error = null;
    },
  },
});

export const {
  searchPatientsRequest,
  searchPatientsSuccess,
  searchPatientsFailure,
  clearPatientSearch,
} = patientManagementSlice.actions;

export const selectPatientSearchResults = (state: RootState) =>
  state.reception.patientmanagement.results;
export const selectPatientSearchLoading = (state: RootState) =>
  state.reception.patientmanagement.loading;
export const selectPatientSearchError = (state: RootState) =>
  state.reception.patientmanagement.error;

export default patientManagementSlice.reducer;
