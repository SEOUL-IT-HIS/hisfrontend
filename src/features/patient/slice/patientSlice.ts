import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  Patient,
  PatientDuplicateCheckRequest,
  PatientRegisterRequest,
} from "../type/patientType";

type PatientState = {
  registeredPatient: Patient | null;
  duplicated: boolean | null;
  registerLoading: boolean;
  duplicateCheckLoading: boolean;
  error: string | null;
};

const initialState: PatientState = {
  registeredPatient: null,
  duplicated: null,
  registerLoading: false,
  duplicateCheckLoading: false,
  error: null,
};

const patientSlice = createSlice({
  name: "patient",
  initialState,
  reducers: {
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
  registerPatientRequest,
  registerPatientSuccess,
  registerPatientFailure,
  checkPatientDuplicateRequest,
  checkPatientDuplicateSuccess,
  checkPatientDuplicateFailure,
  resetPatientRegistration,
} = patientSlice.actions;

export default patientSlice.reducer;
