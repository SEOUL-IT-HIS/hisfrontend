import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  Consent,
  ConsentState,
  CreateConsentRequest,
} from "@/features/surgery/consent/types";

/**
 * 수술 동의서 slice (SL2-42)
 *
 * <p>상태만 관리하고 API 호출은 saga 가 담당한다(§10.3).
 * createSlice name = "surgery/consent" (§10.2 서비스 prefix 유지)</p>
 */
const initialState: ConsentState = {
  consents: [],
  patientConsents: [],
  loading: false,
  saving: false,
  error: "",
};

const consentSlice = createSlice({
  name: "surgery/consent",
  initialState,
  reducers: {
    // ----- 조회 (SL2-54 수술별 / SL2-222 환자별) -----
    fetchConsentsRequest: {
      reducer(state) {
        state.loading = true;
        state.error = "";
      },
      prepare(surgeryId: string) {
        return { payload: surgeryId };
      },
    },
    fetchConsentsSuccess(state, action: PayloadAction<Consent[]>) {
      state.loading = false;
      state.consents = action.payload;
    },
    fetchConsentsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    fetchPatientConsentsRequest: {
      reducer(state) {
        state.loading = true;
        state.error = "";
      },
      prepare(patientId: string) {
        return { payload: patientId };
      },
    },
    fetchPatientConsentsSuccess(state, action: PayloadAction<Consent[]>) {
      state.loading = false;
      state.patientConsents = action.payload;
    },
    fetchPatientConsentsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // ----- 등록 (SL2-53) -----
    createConsentRequest: {
      reducer(state) {
        state.saving = true;
        state.error = "";
      },
      prepare(surgeryId: string, request: CreateConsentRequest) {
        return { payload: { surgeryId, request } };
      },
    },
    consentMutationSuccess(state) {
      state.saving = false;
      state.error = "";
    },
    consentMutationFailure(state, action: PayloadAction<string>) {
      state.saving = false;
      state.error = action.payload;
    },

    resetConsentState() {
      return initialState;
    },
  },
});

export const {
  fetchConsentsRequest,
  fetchConsentsSuccess,
  fetchConsentsFailure,
  fetchPatientConsentsRequest,
  fetchPatientConsentsSuccess,
  fetchPatientConsentsFailure,
  createConsentRequest,
  consentMutationSuccess,
  consentMutationFailure,
  resetConsentState,
} = consentSlice.actions;

export default consentSlice.reducer;

// ----- Selector (§10.4) -----
// 등록 전제: rootReducer 에 surgery: combineReducers({ consent, ... })
type ConsentRoot = { surgery: { consent: ConsentState } };

export const selectConsents = (state: ConsentRoot) =>
  state.surgery.consent.consents;
export const selectPatientConsents = (state: ConsentRoot) =>
  state.surgery.consent.patientConsents;
export const selectConsentLoading = (state: ConsentRoot) =>
  state.surgery.consent.loading;
export const selectConsentSaving = (state: ConsentRoot) =>
  state.surgery.consent.saving;
export const selectConsentError = (state: ConsentRoot) =>
  state.surgery.consent.error;
