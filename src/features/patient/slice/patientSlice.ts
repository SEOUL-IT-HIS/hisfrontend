import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  Patient,
  PatientDetail,
  PatientDuplicateCheckRequest,
  PatientListItem,
  PatientRegisterRequest,
  PatientSearchCondition,
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
};

const patientSlice = createSlice({
  name: "patient",
  initialState,
  reducers: {
    fetchPatientListRequest(
     state,
    _action: PayloadAction<PatientSearchCondition>,
    ) {
     state.listLoading = true;
     state.listError = null;
    },
    fetchPatientListSuccess(
      state,
      action: PayloadAction<PatientListItem[]>,
    ) {
      state.listLoading = false;
      state.patients = action.payload;
    },
    fetchPatientListFailure(state, action: PayloadAction<string>) {
      state.listLoading = false;
      state.listError = action.payload;
    },

    fetchPatientDetailRequest(
  state,
  action: PayloadAction<string>,
) {
  void action;

  state.detailLoading = true;
  state.detailError = null;
  state.patientDetail = null;
},

fetchPatientDetailSuccess(
  state,
  action: PayloadAction<PatientDetail>,
) {
  state.detailLoading = false;
  state.patientDetail = action.payload;
},

fetchPatientDetailFailure(
  state,
  action: PayloadAction<string>,
) {
  state.detailLoading = false;
  state.detailError = action.payload;
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
} = patientSlice.actions;

export default patientSlice.reducer;
