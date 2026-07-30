import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  EmsInfoState,
  EmsReferral,
  EwsRecord,
  IsolationAssessment,
  IsolationCreateRequest,
  IsolationState,
  KtasCreateRequest,
  KtasState,
  KtasUpdateRequest,
  RiskScreening,
  RiskScreeningCreateRequest,
  RiskScreeningState,
  TriageAssessment,
  VitalAssessmentCreateRequest,
  VitalsState,
} from "@/features/emergency/types";

/**
 * emergency(ER-TRIAGE) slice — UC-TRI-01~06 / Jira UD2-8,9,10,11,12,43
 * 상태만 관리하고, API 호출은 saga 가 담당한다. (가이드 10.3)
 *
 * createSlice name = "emergency/triage"
 */
interface TriageState {
  emsInfo: EmsInfoState;
  ktas: KtasState;
  vitals: VitalsState;
  isolation: IsolationState;
  riskScreening: RiskScreeningState;
}

const initialState: TriageState = {
  emsInfo: { items: [], loading: false, error: "", searched: false },
  ktas: { items: [], loading: false, error: "", searched: false, submitting: false, submitError: "" },
  vitals: { items: [], loading: false, error: "", searched: false, submitting: false, submitError: "" },
  isolation: { items: [], loading: false, error: "", searched: false, submitting: false, submitError: "" },
  riskScreening: { items: [], loading: false, error: "", searched: false, submitting: false, submitError: "" },
};

const triageSlice = createSlice({
  name: "emergency/triage",
  initialState,
  reducers: {
    // ----- EMS 정보 조회 (UD2-8) -----
    fetchEmsInfoRequest: {
      reducer(state) {
        state.emsInfo.loading = true;
        state.emsInfo.error = "";
      },
      prepare(receptionNo?: string) {
        return { payload: receptionNo };
      },
    },
    fetchEmsInfoSuccess(state, action: PayloadAction<EmsReferral[]>) {
      state.emsInfo.loading = false;
      state.emsInfo.error = "";
      state.emsInfo.items = action.payload;
      state.emsInfo.searched = true;
    },
    fetchEmsInfoFailure(state, action: PayloadAction<string>) {
      state.emsInfo.loading = false;
      state.emsInfo.error = action.payload;
      state.emsInfo.searched = true;
    },

    // ----- KTAS 분류/재평가 (UD2-9, UD2-43) -----
    fetchKtasHistoryRequest: {
      reducer(state) {
        state.ktas.loading = true;
        state.ktas.error = "";
      },
      prepare(receptionNo: string) {
        return { payload: receptionNo };
      },
    },
    fetchKtasHistorySuccess(state, action: PayloadAction<TriageAssessment[]>) {
      state.ktas.loading = false;
      state.ktas.error = "";
      state.ktas.items = action.payload;
      state.ktas.searched = true;
    },
    fetchKtasHistoryFailure(state, action: PayloadAction<string>) {
      state.ktas.loading = false;
      state.ktas.error = action.payload;
      state.ktas.searched = true;
    },
    createKtasRequest: {
      reducer(state) {
        state.ktas.submitting = true;
        state.ktas.submitError = "";
      },
      prepare(request: KtasCreateRequest) {
        return { payload: request };
      },
    },
    reassessKtasRequest: {
      reducer(state) {
        state.ktas.submitting = true;
        state.ktas.submitError = "";
      },
      prepare(id: string, request: KtasUpdateRequest) {
        return { payload: { id, request } };
      },
    },
    ktasSubmitSuccess(state, action: PayloadAction<TriageAssessment>) {
      state.ktas.submitting = false;
      state.ktas.submitError = "";
      state.ktas.items = [...state.ktas.items, action.payload];
    },
    ktasSubmitFailure(state, action: PayloadAction<string>) {
      state.ktas.submitting = false;
      state.ktas.submitError = action.payload;
    },
    resetKtasSubmitError(state) {
      state.ktas.submitError = "";
    },

    // ----- 초기 환자상태 평가 / 활력징후 (UD2-10) -----
    fetchVitalsRequest: {
      reducer(state) {
        state.vitals.loading = true;
        state.vitals.error = "";
      },
      prepare(receptionNo: string) {
        return { payload: receptionNo };
      },
    },
    fetchVitalsSuccess(state, action: PayloadAction<EwsRecord[]>) {
      state.vitals.loading = false;
      state.vitals.error = "";
      state.vitals.items = action.payload;
      state.vitals.searched = true;
    },
    fetchVitalsFailure(state, action: PayloadAction<string>) {
      state.vitals.loading = false;
      state.vitals.error = action.payload;
      state.vitals.searched = true;
    },
    createVitalsRequest: {
      reducer(state) {
        state.vitals.submitting = true;
        state.vitals.submitError = "";
      },
      prepare(request: VitalAssessmentCreateRequest) {
        return { payload: request };
      },
    },
    createVitalsSuccess(state, action: PayloadAction<EwsRecord[]>) {
      state.vitals.submitting = false;
      state.vitals.submitError = "";
      state.vitals.items = [...state.vitals.items, ...action.payload];
    },
    createVitalsFailure(state, action: PayloadAction<string>) {
      state.vitals.submitting = false;
      state.vitals.submitError = action.payload;
    },
    resetVitalsSubmitError(state) {
      state.vitals.submitError = "";
    },

    // ----- 감염병 격리 관리 (UD2-11) -----
    fetchIsolationsRequest: {
      reducer(state) {
        state.isolation.loading = true;
        state.isolation.error = "";
      },
      prepare(receptionNo: string) {
        return { payload: receptionNo };
      },
    },
    fetchIsolationsSuccess(state, action: PayloadAction<IsolationAssessment[]>) {
      state.isolation.loading = false;
      state.isolation.error = "";
      state.isolation.items = action.payload;
      state.isolation.searched = true;
    },
    fetchIsolationsFailure(state, action: PayloadAction<string>) {
      state.isolation.loading = false;
      state.isolation.error = action.payload;
      state.isolation.searched = true;
    },
    createIsolationRequest: {
      reducer(state) {
        state.isolation.submitting = true;
        state.isolation.submitError = "";
      },
      prepare(request: IsolationCreateRequest) {
        return { payload: request };
      },
    },
    releaseIsolationRequest: {
      reducer(state) {
        state.isolation.submitting = true;
        state.isolation.submitError = "";
      },
      prepare(id: string) {
        return { payload: id };
      },
    },
    isolationSubmitSuccess(state, action: PayloadAction<IsolationAssessment>) {
      state.isolation.submitting = false;
      state.isolation.submitError = "";
      const idx = state.isolation.items.findIndex((item) => item.id === action.payload.id);
      if (idx >= 0) {
        state.isolation.items[idx] = action.payload;
      } else {
        state.isolation.items = [...state.isolation.items, action.payload];
      }
    },
    isolationSubmitFailure(state, action: PayloadAction<string>) {
      state.isolation.submitting = false;
      state.isolation.submitError = action.payload;
    },
    resetIsolationSubmitError(state) {
      state.isolation.submitError = "";
    },

    // ----- 패혈증-뇌졸중 위험도 스크리닝 (UD2-12) -----
    fetchRiskScreeningsRequest: {
      reducer(state) {
        state.riskScreening.loading = true;
        state.riskScreening.error = "";
      },
      prepare(receptionNo: string) {
        return { payload: receptionNo };
      },
    },
    fetchRiskScreeningsSuccess(state, action: PayloadAction<RiskScreening[]>) {
      state.riskScreening.loading = false;
      state.riskScreening.error = "";
      state.riskScreening.items = action.payload;
      state.riskScreening.searched = true;
    },
    fetchRiskScreeningsFailure(state, action: PayloadAction<string>) {
      state.riskScreening.loading = false;
      state.riskScreening.error = action.payload;
      state.riskScreening.searched = true;
    },
    createRiskScreeningRequest: {
      reducer(state) {
        state.riskScreening.submitting = true;
        state.riskScreening.submitError = "";
      },
      prepare(request: RiskScreeningCreateRequest) {
        return { payload: request };
      },
    },
    riskScreeningSubmitSuccess(state, action: PayloadAction<RiskScreening>) {
      state.riskScreening.submitting = false;
      state.riskScreening.submitError = "";
      state.riskScreening.items = [...state.riskScreening.items, action.payload];
    },
    riskScreeningSubmitFailure(state, action: PayloadAction<string>) {
      state.riskScreening.submitting = false;
      state.riskScreening.submitError = action.payload;
    },
    resetRiskScreeningSubmitError(state) {
      state.riskScreening.submitError = "";
    },
  },
});

export const {
  fetchEmsInfoRequest,
  fetchEmsInfoSuccess,
  fetchEmsInfoFailure,
  fetchKtasHistoryRequest,
  fetchKtasHistorySuccess,
  fetchKtasHistoryFailure,
  createKtasRequest,
  reassessKtasRequest,
  ktasSubmitSuccess,
  ktasSubmitFailure,
  resetKtasSubmitError,
  fetchVitalsRequest,
  fetchVitalsSuccess,
  fetchVitalsFailure,
  createVitalsRequest,
  createVitalsSuccess,
  createVitalsFailure,
  resetVitalsSubmitError,
  fetchIsolationsRequest,
  fetchIsolationsSuccess,
  fetchIsolationsFailure,
  createIsolationRequest,
  releaseIsolationRequest,
  isolationSubmitSuccess,
  isolationSubmitFailure,
  resetIsolationSubmitError,
  fetchRiskScreeningsRequest,
  fetchRiskScreeningsSuccess,
  fetchRiskScreeningsFailure,
  createRiskScreeningRequest,
  riskScreeningSubmitSuccess,
  riskScreeningSubmitFailure,
  resetRiskScreeningSubmitError,
} = triageSlice.actions;

export default triageSlice.reducer;

// ----- Selector (가이드 10.4) -----
// 등록 전제: emergency: triageReducer (combineReducers 불필요, 단일 슬라이스)
type TriageRoot = { emergency: TriageState };

export const selectEmsInfoItems = (state: TriageRoot) => state.emergency.emsInfo.items;
export const selectEmsInfoLoading = (state: TriageRoot) => state.emergency.emsInfo.loading;
export const selectEmsInfoError = (state: TriageRoot) => state.emergency.emsInfo.error;
export const selectEmsInfoSearched = (state: TriageRoot) => state.emergency.emsInfo.searched;

export const selectKtasItems = (state: TriageRoot) => state.emergency.ktas.items;
export const selectKtasLoading = (state: TriageRoot) => state.emergency.ktas.loading;
export const selectKtasError = (state: TriageRoot) => state.emergency.ktas.error;
export const selectKtasSearched = (state: TriageRoot) => state.emergency.ktas.searched;
export const selectKtasSubmitting = (state: TriageRoot) => state.emergency.ktas.submitting;
export const selectKtasSubmitError = (state: TriageRoot) => state.emergency.ktas.submitError;

export const selectVitalsItems = (state: TriageRoot) => state.emergency.vitals.items;
export const selectVitalsLoading = (state: TriageRoot) => state.emergency.vitals.loading;
export const selectVitalsError = (state: TriageRoot) => state.emergency.vitals.error;
export const selectVitalsSearched = (state: TriageRoot) => state.emergency.vitals.searched;
export const selectVitalsSubmitting = (state: TriageRoot) => state.emergency.vitals.submitting;
export const selectVitalsSubmitError = (state: TriageRoot) => state.emergency.vitals.submitError;

export const selectIsolationItems = (state: TriageRoot) => state.emergency.isolation.items;
export const selectIsolationLoading = (state: TriageRoot) => state.emergency.isolation.loading;
export const selectIsolationError = (state: TriageRoot) => state.emergency.isolation.error;
export const selectIsolationSearched = (state: TriageRoot) => state.emergency.isolation.searched;
export const selectIsolationSubmitting = (state: TriageRoot) => state.emergency.isolation.submitting;
export const selectIsolationSubmitError = (state: TriageRoot) => state.emergency.isolation.submitError;

export const selectRiskScreeningItems = (state: TriageRoot) => state.emergency.riskScreening.items;
export const selectRiskScreeningLoading = (state: TriageRoot) => state.emergency.riskScreening.loading;
export const selectRiskScreeningError = (state: TriageRoot) => state.emergency.riskScreening.error;
export const selectRiskScreeningSearched = (state: TriageRoot) => state.emergency.riskScreening.searched;
export const selectRiskScreeningSubmitting = (state: TriageRoot) => state.emergency.riskScreening.submitting;
export const selectRiskScreeningSubmitError = (state: TriageRoot) => state.emergency.riskScreening.submitError;
