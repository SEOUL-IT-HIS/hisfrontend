import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  KtasCreateRequest,
  KtasState,
  KtasUpdateRequest,
  TriageAssessment,
} from "@/features/emergency/ktas/types";

/** ktas(KTAS 분류/재평가) slice — UC-TRI-02/03 / Jira UD2-9, UD2-43 */
const initialState: KtasState = {
  items: [],
  loading: false,
  error: "",
  searched: false,
  submitting: false,
  submitError: "",
};

const ktasSlice = createSlice({
  name: "emergency/ktas",
  initialState,
  reducers: {
    fetchKtasHistoryRequest: {
      reducer(state) {
        state.loading = true;
        state.error = "";
      },
      prepare(receptionNo: string) {
        return { payload: receptionNo };
      },
    },
    fetchKtasHistorySuccess(state, action: PayloadAction<TriageAssessment[]>) {
      state.loading = false;
      state.error = "";
      state.items = action.payload;
      state.searched = true;
    },
    fetchKtasHistoryFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
      state.searched = true;
    },
    createKtasRequest: {
      reducer(state) {
        state.submitting = true;
        state.submitError = "";
      },
      prepare(request: KtasCreateRequest) {
        return { payload: request };
      },
    },
    reassessKtasRequest: {
      reducer(state) {
        state.submitting = true;
        state.submitError = "";
      },
      prepare(id: string, request: KtasUpdateRequest) {
        return { payload: { id, request } };
      },
    },
    ktasSubmitSuccess(state, action: PayloadAction<TriageAssessment>) {
      state.submitting = false;
      state.submitError = "";
      state.items = [...state.items, action.payload];
    },
    ktasSubmitFailure(state, action: PayloadAction<string>) {
      state.submitting = false;
      state.submitError = action.payload;
    },
    resetKtasSubmitError(state) {
      state.submitError = "";
    },
  },
});

export const {
  fetchKtasHistoryRequest,
  fetchKtasHistorySuccess,
  fetchKtasHistoryFailure,
  createKtasRequest,
  reassessKtasRequest,
  ktasSubmitSuccess,
  ktasSubmitFailure,
  resetKtasSubmitError,
} = ktasSlice.actions;

export default ktasSlice.reducer;

// ----- Selector (가이드 10.4) -----
type KtasRoot = { emergency: { ktas: KtasState } };

export const selectKtasItems = (state: KtasRoot) => state.emergency.ktas.items;
export const selectKtasLoading = (state: KtasRoot) => state.emergency.ktas.loading;
export const selectKtasError = (state: KtasRoot) => state.emergency.ktas.error;
export const selectKtasSearched = (state: KtasRoot) => state.emergency.ktas.searched;
export const selectKtasSubmitting = (state: KtasRoot) => state.emergency.ktas.submitting;
export const selectKtasSubmitError = (state: KtasRoot) => state.emergency.ktas.submitError;
