import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  Patient,
  PatientDetail,
  PatientDuplicateCheckRequest,
  PatientListItem,
  PatientRegisterRequest,
  PatientSearchCondition,
  PatientUpdateRequest,
  PatientDeactivateRequest,
  PatientDeathUpdateRequest,
  PatientTemporaryConversionRequest,
  PatientActivateRequest,
} from "../type/patientType";

type PatientState = {
  patients: PatientListItem[];
  patientDetail: PatientDetail | null;
  registeredPatient: Patient | null;
  duplicated: boolean | null;
  listLoading: boolean;
  detailLoading: boolean;
  registerLoading: boolean;
  duplicateCheckLoading: boolean;
  listError: string | null;
  detailError: string | null;
  error: string | null;
  updateLoading: boolean;
  updateError: string | null;
  updateSuccess: boolean;
  deactivateLoading: boolean;
  deactivateError: string | null;
  deactivateSuccess: boolean;
  deathUpdateLoading: boolean;
  deathUpdateError: string | null;
  deathUpdateSuccess: boolean;
  temporaryConversionLoading: boolean;
  temporaryConversionError: string | null;
  temporaryConversionSuccess: boolean;
  conversionDuplicateLoading: boolean;
  conversionDuplicated: boolean | null;
  conversionDuplicateError: string | null;
  activateLoading: boolean;
  activateError: string | null;
  activateSuccess: boolean;
};

const initialState: PatientState = {
  patients: [],
  patientDetail: null,
  registeredPatient: null,
  duplicated: null,
  listLoading: false,
  detailLoading: false,
  registerLoading: false,
  duplicateCheckLoading: false,
  listError: null,
  detailError: null,
  error: null,
  updateLoading: false,
  updateError: null,
  updateSuccess: false,
  deactivateLoading: false,
  deactivateError: null,
  deactivateSuccess: false,
  deathUpdateLoading: false,
  deathUpdateError: null,
  deathUpdateSuccess: false,
  temporaryConversionLoading: false,
  temporaryConversionError: null,
  temporaryConversionSuccess: false,
  conversionDuplicateLoading: false,
  conversionDuplicated: null,
  conversionDuplicateError: null,
  activateLoading: false,
  activateError: null,
  activateSuccess: false,
};

const patientSlice = createSlice({
  name: "patient",
  initialState,
  reducers: {
    fetchPatientListRequest(
      state,
      _action: PayloadAction<PatientSearchCondition>,
    ) {
      void _action;
      state.listLoading = true;
      state.listError = null;
    },
    fetchPatientListSuccess(state, action: PayloadAction<PatientListItem[]>) {
      state.listLoading = false;
      state.patients = action.payload;
    },
    fetchPatientListFailure(state, action: PayloadAction<string>) {
      state.listLoading = false;
      state.listError = action.payload;
    },

    fetchPatientDetailRequest(state, action: PayloadAction<string>) {
      void action;

      state.detailLoading = true;
      state.detailError = null;
      state.patientDetail = null;
    },

    fetchPatientDetailSuccess(state, action: PayloadAction<PatientDetail>) {
      state.detailLoading = false;
      state.patientDetail = action.payload;
    },

    fetchPatientDetailFailure(state, action: PayloadAction<string>) {
      state.detailLoading = false;
      state.detailError = action.payload;
    },

    updatePatientRequest(state, _action: PayloadAction<PatientUpdateRequest>) {
      void _action;
      state.updateLoading = true;
      state.updateError = null;
      state.updateSuccess = false;
    },

    updatePatientSuccess(state, action: PayloadAction<PatientDetail>) {
      state.updateLoading = false;
      state.updateError = null;
      state.updateSuccess = true;
      state.patientDetail = action.payload;
    },

    updatePatientFailure(state, action: PayloadAction<string>) {
      state.updateLoading = false;
      state.updateError = action.payload;
      state.updateSuccess = false;
    },

    resetPatientUpdate(state) {
      state.updateLoading = false;
      state.updateError = null;
      state.updateSuccess = false;
    },

    convertTemporaryPatientRequest(
      state,
      _action: PayloadAction<PatientTemporaryConversionRequest>,
    ) {
      void _action;
      state.temporaryConversionLoading = true;
      state.temporaryConversionError = null;
      state.temporaryConversionSuccess = false;
    },

    convertTemporaryPatientSuccess(
      state,
      action: PayloadAction<PatientDetail>,
    ) {
      state.temporaryConversionLoading = false;
      state.temporaryConversionError = null;
      state.temporaryConversionSuccess = true;
      state.patientDetail = action.payload;
    },

    convertTemporaryPatientFailure(state, action: PayloadAction<string>) {
      state.temporaryConversionLoading = false;
      state.temporaryConversionError = action.payload;
      state.temporaryConversionSuccess = false;
    },

    resetTemporaryPatientConversion(state) {
      state.temporaryConversionLoading = false;
      state.temporaryConversionError = null;
      state.temporaryConversionSuccess = false;
    },

    checkConversionDuplicateRequest(
      state,
      _action: PayloadAction<PatientDuplicateCheckRequest>,
    ) {
      void _action;
      state.conversionDuplicateLoading = true;
      state.conversionDuplicated = null;
      state.conversionDuplicateError = null;
    },

    checkConversionDuplicateSuccess(state, action: PayloadAction<boolean>) {
      state.conversionDuplicateLoading = false;
      state.conversionDuplicated = action.payload;
    },

    checkConversionDuplicateFailure(state, action: PayloadAction<string>) {
      state.conversionDuplicateLoading = false;
      state.conversionDuplicateError = action.payload;
    },

    resetConversionDuplicate(state) {
      state.conversionDuplicateLoading = false;
      state.conversionDuplicated = null;
      state.conversionDuplicateError = null;
    },

    updatePatientDeathRequest(
      state,
      _action: PayloadAction<PatientDeathUpdateRequest>,
    ) {
      void _action;
      state.deathUpdateLoading = true;
      state.deathUpdateError = null;
      state.deathUpdateSuccess = false;
    },

    updatePatientDeathSuccess(state, action: PayloadAction<PatientDetail>) {
      state.deathUpdateLoading = false;
      state.deathUpdateError = null;
      state.deathUpdateSuccess = true;
      state.patientDetail = action.payload;
    },

    updatePatientDeathFailure(state, action: PayloadAction<string>) {
      state.deathUpdateLoading = false;
      state.deathUpdateError = action.payload;
      state.deathUpdateSuccess = false;
    },

    resetPatientDeathUpdate(state) {
      state.deathUpdateLoading = false;
      state.deathUpdateError = null;
      state.deathUpdateSuccess = false;
    },

    deactivatePatientRequest(
      state,
      _action: PayloadAction<PatientDeactivateRequest>,
    ) {
      void _action;
      state.deactivateLoading = true;
      state.deactivateError = null;
      state.deactivateSuccess = false;
    },

    deactivatePatientSuccess(state, action: PayloadAction<PatientDetail>) {
      state.deactivateLoading = false;
      state.deactivateError = null;
      state.deactivateSuccess = true;
      state.patientDetail = action.payload;
    },

    deactivatePatientFailure(state, action: PayloadAction<string>) {
      state.deactivateLoading = false;
      state.deactivateError = action.payload;
      state.deactivateSuccess = false;
    },

    resetPatientDeactivation(state) {
      state.deactivateLoading = false;
      state.deactivateError = null;
      state.deactivateSuccess = false;
    },

    activatePatientRequest(
      state,
      _action: PayloadAction<PatientActivateRequest>,
    ) {
      void _action;
      state.activateLoading = true;
      state.activateError = null;
      state.activateSuccess = false;
    },

    activatePatientSuccess(state, action: PayloadAction<PatientDetail>) {
      state.activateLoading = false;
      state.activateSuccess = true;
      state.patientDetail = action.payload;
    },

    activatePatientFailure(state, action: PayloadAction<string>) {
      state.activateLoading = false;
      state.activateError = action.payload;
    },

    resetPatientActivation(state) {
      state.activateLoading = false;
      state.activateError = null;
      state.activateSuccess = false;
    },

    registerPatientRequest: {
      reducer(state) {
        state.registerLoading = true;
        state.error = null;
      },
      prepare(patientData: PatientRegisterRequest) {
        return { payload: patientData };
      },
    },
    registerPatientSuccess(state, action: PayloadAction<Patient>) {
      state.registerLoading = false;
      state.registeredPatient = action.payload;
    },
    registerPatientFailure(state, action: PayloadAction<string>) {
      state.registerLoading = false;
      state.error = action.payload;
    },
    checkPatientDuplicateRequest: {
      reducer(state) {
        state.duplicateCheckLoading = true;
        state.duplicated = null;
        state.error = null;
      },
      prepare(duplicateCheckData: PatientDuplicateCheckRequest) {
        return { payload: duplicateCheckData };
      },
    },
    checkPatientDuplicateSuccess(state, action: PayloadAction<boolean>) {
      state.duplicateCheckLoading = false;
      state.duplicated = action.payload;
    },
    checkPatientDuplicateFailure(state, action: PayloadAction<string>) {
      state.duplicateCheckLoading = false;
      state.error = action.payload;
    },
    resetPatientRegistration(state) {
      state.registeredPatient = null;
      state.duplicated = null;
      state.error = null;
    },
  },
});

export const {
  fetchPatientListRequest,
  fetchPatientListSuccess,
  fetchPatientListFailure,
  fetchPatientDetailRequest,
  fetchPatientDetailSuccess,
  fetchPatientDetailFailure,
  registerPatientRequest,
  registerPatientSuccess,
  registerPatientFailure,
  checkPatientDuplicateRequest,
  checkPatientDuplicateSuccess,
  checkPatientDuplicateFailure,
  resetPatientRegistration,
  updatePatientRequest,
  updatePatientSuccess,
  updatePatientFailure,
  resetPatientUpdate,
  deactivatePatientRequest,
  deactivatePatientSuccess,
  deactivatePatientFailure,
  resetPatientDeactivation,
  updatePatientDeathRequest,
  updatePatientDeathSuccess,
  updatePatientDeathFailure,
  resetPatientDeathUpdate,
  convertTemporaryPatientRequest,
  convertTemporaryPatientSuccess,
  convertTemporaryPatientFailure,
  resetTemporaryPatientConversion,
  checkConversionDuplicateRequest,
  checkConversionDuplicateSuccess,
  checkConversionDuplicateFailure,
  resetConversionDuplicate,
  activatePatientRequest,
  activatePatientSuccess,
  activatePatientFailure,
  resetPatientActivation,
} = patientSlice.actions;

export default patientSlice.reducer;
