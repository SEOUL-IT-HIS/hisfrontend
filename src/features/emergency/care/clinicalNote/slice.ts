import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  ClinicalNote,
  ClinicalNoteCreateRequest,
  ClinicalNoteState,
} from "@/features/emergency/care/clinicalNote/types";

const initialState: ClinicalNoteState = {
  items: [],
  loading: false,
  error: "",
  searched: false,
  submitting: false,
  submitError: "",
};

const clinicalNoteSlice = createSlice({
  name: "emergency/clinicalNote",
  initialState,
  reducers: {
    fetchClinicalNotesRequest: {
      reducer(state) {
        state.loading = true;
        state.error = "";
      },
      prepare(receptionId: string) {
        return { payload: receptionId };
      },
    },
    fetchClinicalNotesSuccess(state, action: PayloadAction<ClinicalNote[]>) {
      state.loading = false;
      state.error = "";
      state.items = action.payload;
      state.searched = true;
    },
    fetchClinicalNotesFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
      state.searched = true;
    },
    createClinicalNoteRequest: {
      reducer(state) {
        state.submitting = true;
        state.submitError = "";
      },
      prepare(request: ClinicalNoteCreateRequest) {
        return { payload: request };
      },
    },
    clinicalNoteSubmitSuccess(state, action: PayloadAction<ClinicalNote>) {
      state.submitting = false;
      state.submitError = "";
      state.items = [...state.items, action.payload];
    },
    clinicalNoteSubmitFailure(state, action: PayloadAction<string>) {
      state.submitting = false;
      state.submitError = action.payload;
    },
    resetClinicalNoteSubmitError(state) {
      state.submitError = "";
    },
  },
});

export const {
  fetchClinicalNotesRequest,
  fetchClinicalNotesSuccess,
  fetchClinicalNotesFailure,
  createClinicalNoteRequest,
  clinicalNoteSubmitSuccess,
  clinicalNoteSubmitFailure,
  resetClinicalNoteSubmitError,
} = clinicalNoteSlice.actions;

export default clinicalNoteSlice.reducer;

type ClinicalNoteRoot = { emergency: { clinicalNote: ClinicalNoteState } };

export const selectClinicalNoteItems = (state: ClinicalNoteRoot) => state.emergency.clinicalNote.items;
export const selectClinicalNoteLoading = (state: ClinicalNoteRoot) => state.emergency.clinicalNote.loading;
export const selectClinicalNoteError = (state: ClinicalNoteRoot) => state.emergency.clinicalNote.error;
export const selectClinicalNoteSearched = (state: ClinicalNoteRoot) => state.emergency.clinicalNote.searched;
export const selectClinicalNoteSubmitting = (state: ClinicalNoteRoot) => state.emergency.clinicalNote.submitting;
export const selectClinicalNoteSubmitError = (state: ClinicalNoteRoot) => state.emergency.clinicalNote.submitError;
