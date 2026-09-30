import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  ConsentRecord,
  ConsentRecordCreateRequest,
  ConsentState,
} from "@/features/emergency/care/consent/types";

/** consent(동의 기록) slice — Jira UD2-25 */
const initialState: ConsentState = {
  items: [],
  loading: false,
  error: "",
  submitting: false,
  submitError: "",
};

const consentSlice = createSlice({
  name: "emergency/consent",
  initialState,
  reducers: {
    fetchConsentsRequest: {
      reducer(state) {
        state.loading = true;
        state.error = "";
      },
      prepare(receptionId: string) {
        return { payload: receptionId };
      },
    },
    fetchConsentsSuccess(state, action: PayloadAction<ConsentRecord[]>) {
      state.loading = false;
      state.error = "";
      state.items = action.payload;
    },
    fetchConsentsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    createConsentRequest: {
      reducer(state) {
        state.submitting = true;
        state.submitError = "";
      },
      prepare(request: ConsentRecordCreateRequest) {
        return { payload: request };
      },
    },
    createConsentSuccess(state, action: PayloadAction<ConsentRecord>) {
      state.submitting = false;
      state.submitError = "";
      // 서버 정렬(수령 일시 최신순)과 같은 순서를 유지한다.
      state.items = [action.payload, ...state.items].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
    },
    createConsentFailure(state, action: PayloadAction<string>) {
      state.submitting = false;
      state.submitError = action.payload;
    },
  },
});

export const {
  fetchConsentsRequest,
  fetchConsentsSuccess,
  fetchConsentsFailure,
  createConsentRequest,
  createConsentSuccess,
  createConsentFailure,
} = consentSlice.actions;

export default consentSlice.reducer;

// ----- Selector (가이드 10.4) -----
type ConsentRoot = { emergency: { consent: ConsentState } };

export const selectConsentItems = (state: ConsentRoot) => state.emergency.consent.items;
export const selectConsentLoading = (state: ConsentRoot) => state.emergency.consent.loading;
export const selectConsentError = (state: ConsentRoot) => state.emergency.consent.error;
export const selectConsentSubmitting = (state: ConsentRoot) => state.emergency.consent.submitting;
export const selectConsentSubmitError = (state: ConsentRoot) => state.emergency.consent.submitError;
