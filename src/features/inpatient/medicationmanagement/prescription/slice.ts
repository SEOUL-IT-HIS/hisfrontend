import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Status, PrescriptionDTO, PrescriptionState, PrescriptionCreateDTO } from "../types";

const initialStatus: Status = { loading: false, error: null, success: false };

const initialState: PrescriptionState = {
    list: [],
    detail: null,
    listStatus: { ...initialStatus },
    detailStatus: { ...initialStatus },
    createStatus: { ...initialStatus },
};

const prescriptionSlice = createSlice({
    name: "prescription",
    initialState,
    reducers: {
        fetchPrescriptionsRequest(state, action: PayloadAction<string>) {
            state.listStatus = { ...initialStatus, loading: true };
        },
        fetchPrescriptionsSuccess(state, action: PayloadAction<PrescriptionDTO[]>) {
            state.list = action.payload;
            state.listStatus = { ...initialStatus, success: true };
        },
        fetchPrescriptionsFailure(state, action: PayloadAction<string>) {
            state.listStatus = { ...initialStatus, error: action.payload };
        },
        fetchPrescriptionDetailRequest(state, action: PayloadAction<string>) {
            state.detailStatus = { ...initialStatus, loading: true };
        },
        fetchPrescriptionDetailSuccess(state, action: PayloadAction<PrescriptionDTO>) {
            state.detail = action.payload;
            state.detailStatus = { ...initialStatus, success: true };
        },
        fetchPrescriptionDetailFailure(state, action: PayloadAction<string>) {
            state.detailStatus = { ...initialStatus, error: action.payload };
        },
        createPrescriptionRequest(state, action: PayloadAction<{ admissionId: string; request: PrescriptionCreateDTO }>) {
            state.createStatus = { ...initialStatus, loading: true };
        },
        createPrescriptionSuccess(state, action: PayloadAction<PrescriptionDTO>) {
            state.list.push(action.payload);
            state.createStatus = { ...initialStatus, success: true };
        },
        createPrescriptionFailure(state, action: PayloadAction<string>) {
            state.createStatus = { ...initialStatus, error: action.payload };
        },
        clearPrescriptionState(state) {
            state.createStatus = { ...initialStatus };
        },
    },
});

export const { fetchPrescriptionsRequest, fetchPrescriptionsSuccess, fetchPrescriptionsFailure,
    fetchPrescriptionDetailRequest, fetchPrescriptionDetailSuccess, fetchPrescriptionDetailFailure,
    createPrescriptionRequest, createPrescriptionSuccess, createPrescriptionFailure,
    clearPrescriptionState } = prescriptionSlice.actions;
export default prescriptionSlice.reducer;

// ----- Selector -----
// 등록 전제: rootReducer 에 inpatient: combineReducers({ prescription }) (features/inpatient/slice.ts)
type PrescriptionRoot = { inpatient: { prescription: PrescriptionState } };

export const selectPrescriptions = (state: PrescriptionRoot) =>
  state.inpatient.prescription.list;
export const selectPrescriptionListStatus = (state: PrescriptionRoot) =>
  state.inpatient.prescription.listStatus;
export const selectPrescriptionDetail = (state: PrescriptionRoot) =>
  state.inpatient.prescription.detail;
export const selectPrescriptionDetailStatus = (state: PrescriptionRoot) =>
  state.inpatient.prescription.detailStatus;
export const selectPrescriptionCreateStatus = (state: PrescriptionRoot) =>
  state.inpatient.prescription.createStatus;
