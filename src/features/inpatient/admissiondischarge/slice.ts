import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { AdmissionDTO, AdmissionState, Status } from "./types";


const initialStatus: Status = { loading: false, error: null, success: false };

const initialState: AdmissionState = {
    list: [],
    detail: null,
    listStatus: { ...initialStatus },
    detailStatus: { ...initialStatus },
    createStatus: { ...initialStatus },
    updateStatus: { ...initialStatus },
    deleteStatus: { ...initialStatus },
     changeStatusStatus: { ...initialStatus }, 
};

const AdmissionSlice = createSlice({
    name: "admission",
    initialState,
    reducers: {
        fetchAdmissionsRequest(state) {
            state.listStatus = { ...initialStatus, loading: true };
        },
        fetchAdmissionsSuccess(state, action: PayloadAction<AdmissionDTO[]>) {
            state.list = action.payload;
            state.listStatus = { ...initialStatus, success: true };
        },
        fetchAdmissionsFailure(state, action: PayloadAction<string>) {
            state.listStatus = { ...initialStatus, error: action.payload };
        },
        fetchAdmissionDetailRequest(state, action: PayloadAction<string>) {
            state.detailStatus = { ...initialStatus, loading: true };
        },
        fetchAdmissionDetailSuccess(state, action: PayloadAction<AdmissionDTO>) {
            state.detail = action.payload;
            state.detailStatus = { ...initialStatus, success: true };
        },
        fetchAdmissionDetailFailure(state, action: PayloadAction<string>) {
            state.detailStatus = { ...initialStatus, error: action.payload };
        },
        createAdmissionRequest(state, action: PayloadAction<RegisterAdmissionRequest>) {
            state.createStatus = { ...initialStatus, loading: true };
        },
        createAdmissionSuccess(state, action: PayloadAction<AdmissionDTO>) {
            state.list.push(action.payload);
            state.createStatus = { ...initialStatus, success: true };
        },
        createAdmissionFailure(state, action: PayloadAction<string>) {
            state.createStatus = { ...initialStatus, error: action.payload };
        },
        updateAdmissionRequest(state, action: PayloadAction<UpdateAdmissionRequest>) {
            state.updateStatus = { ...initialStatus, loading: true };
        },
        updateAdmissionSuccess(state, action: PayloadAction<AdmissionDTO>) {
            const index = state.list.findIndex((admission) => admission.admissionId === action.payload.admissionId);
            if (index !== -1) {
                state.list[index] = action.payload;
            }
            state.updateStatus = { ...initialStatus, success: true };
        },
        updateAdmissionFailure(state, action: PayloadAction<string>) {
            state.updateStatus = { ...initialStatus, error: action.payload };
        },
        deleteAdmissionRequest(state, action: PayloadAction<string>) {
            state.deleteStatus = { ...initialStatus, loading: true };
        },
        deleteAdmissionSuccess(state, action: PayloadAction<string>) {
            state.list = state.list.filter((admission) => admission.admissionId !== action.payload);
            state.deleteStatus = { ...initialStatus, success: true };
        },
        deleteAdmissionFailure(state, action: PayloadAction<string>) {
            state.deleteStatus = { ...initialStatus, error: action.payload };
        }, 
        changeStatusRequest(state, action: PayloadAction<{ admissionId: string; status: string }>) {
        state.changeStatusStatus = { ...initialStatus, loading: true };
        },
        changeStatusSuccess(state, action: PayloadAction<AdmissionDTO>) {
        const index = state.list.findIndex((admission) => admission.admissionId === action.payload.admissionId);
        if (index !== -1) {
          state.list[index] = action.payload;
         }
        if (state.detail?.admissionId === action.payload.admissionId) {
        state.detail = action.payload;
        }
        state.changeStatusStatus = { ...initialStatus, success: true };
        },
        changeStatusFailure(state, action: PayloadAction<string>) {
        state.changeStatusStatus = { ...initialStatus, error: action.payload };
        },
    },
});
export const { fetchAdmissionsRequest, fetchAdmissionsSuccess, fetchAdmissionsFailure,
    fetchAdmissionDetailRequest, fetchAdmissionDetailSuccess, fetchAdmissionDetailFailure,
    createAdmissionRequest, createAdmissionSuccess, createAdmissionFailure,
    updateAdmissionRequest, updateAdmissionSuccess, updateAdmissionFailure,
    deleteAdmissionRequest, deleteAdmissionSuccess, deleteAdmissionFailure,
    changeStatusRequest, changeStatusSuccess, changeStatusFailure } = AdmissionSlice.actions;
export default AdmissionSlice.reducer;

// ----- Selector -----
// 등록 전제: rootReducer 에 inpatient: combineReducers({ bedmanagement }) (features/inpatient/slice.ts)
type AdmissionRoot = { inpatient: { admissiondischarge: AdmissionState } };

export const selectAdmissions = (state: AdmissionRoot) =>
  state.inpatient.admissiondischarge.list;
export const selectAdmissionListStatus = (state: AdmissionRoot) =>
  state.inpatient.admissiondischarge.listStatus;
export const selectAdmissionDetail = (state: AdmissionRoot) =>
  state.inpatient.admissiondischarge.detail;
export const selectAdmissionDetailStatus = (state: AdmissionRoot) =>
  state.inpatient.admissiondischarge.detailStatus;
export const selectAdmissionCreateStatus = (state: AdmissionRoot) =>
  state.inpatient.admissiondischarge.createStatus;
export const selectAdmissionUpdateStatus = (state: AdmissionRoot) =>
  state.inpatient.admissiondischarge.updateStatus;
export const selectAdmissionDeleteStatus = (state: AdmissionRoot) =>
  state.inpatient.admissiondischarge.deleteStatus;
export const selectAdmissionChangeStatusStatus = (state: AdmissionRoot) =>
  state.inpatient.admissiondischarge.changeStatusStatus;