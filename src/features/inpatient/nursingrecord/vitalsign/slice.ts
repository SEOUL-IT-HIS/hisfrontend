
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Status, VitalSignDTO, VitalSignState, RegisterVitalSignRequest, UpdateVitalSignRequest } from "../types";


const initialStatus: Status = { loading: false, error: null, success: false };

const initialState: VitalSignState = {
    list: [],
    detail: null,
    listStatus: { ...initialStatus },
    detailStatus: { ...initialStatus },
    createStatus: { ...initialStatus },
    updateStatus: { ...initialStatus },
    deleteStatus: { ...initialStatus },
    scheduleUpdateStatus: { ...initialStatus },
};
const vitalSignSlice = createSlice({
    name: "vitalSign",
    initialState,
    reducers: {
        fetchVitalSignsRequest(state) {
            state.listStatus = { ...initialStatus, loading: true };
        },
        fetchVitalSignsSuccess(state, action: PayloadAction<VitalSignDTO[]>) {
            state.list = action.payload;
            state.listStatus = { ...initialStatus, success: true };
        },
        fetchVitalSignsFailure(state, action: PayloadAction<string>) {
            state.listStatus = { ...initialStatus, error: action.payload };
        },
        fetchVitalSignDetailRequest(state, action: PayloadAction<string>) {
            state.detailStatus = { ...initialStatus, loading: true };
        },
        fetchVitalSignDetailSuccess(state, action: PayloadAction<VitalSignDTO>) {
            state.detail = action.payload;
            state.detailStatus = { ...initialStatus, success: true };
        },
        fetchVitalSignDetailFailure(state, action: PayloadAction<string>) {
            state.detailStatus = { ...initialStatus, error: action.payload };
        },
        createVitalSignRequest(state, action: PayloadAction<RegisterVitalSignRequest>) {
            state.createStatus = { ...initialStatus, loading: true };
        },
        createVitalSignSuccess(state, action: PayloadAction<VitalSignDTO>) {
            state.list.push(action.payload);
            state.createStatus = { ...initialStatus, success: true };
        },
        createVitalSignFailure(state, action: PayloadAction<string>) {
            state.createStatus = { ...initialStatus, error: action.payload };
        },
        updateVitalSignRequest(state, action: PayloadAction<UpdateVitalSignRequest>) {
            state.updateStatus = { ...initialStatus, loading: true };
        },
        updateVitalSignSuccess(state, action: PayloadAction<VitalSignDTO>) {
            const index = state.list.findIndex((vitalSign) => vitalSign.vitalSignId === action.payload.vitalSignId);
            if (index !== -1) {
                state.list[index] = action.payload;
            }
            state.updateStatus = { ...initialStatus, success: true };
        },
        updateVitalSignFailure(state, action: PayloadAction<string>) {
            state.updateStatus = { ...initialStatus, error: action.payload };
        },
        updateVitalSignScheduleRequest(state, action: PayloadAction<{ id: string; reserveAt: string; expectedAdmissionAt: string }>) {
            state.scheduleUpdateStatus = { ...initialStatus, loading: true };
        },
        updateVitalSignScheduleSuccess(state, action: PayloadAction<VitalSignDTO>) {
            const index = state.list.findIndex((vitalSign) => vitalSign.vitalSignId === action.payload.vitalSignId);
            if (index !== -1) {
                state.list[index] = action.payload;
            }
            state.scheduleUpdateStatus = { ...initialStatus, success: true };
        },
        updateVitalSignScheduleFailure(state, action: PayloadAction<string>) {
            state.scheduleUpdateStatus = { ...initialStatus, error: action.payload };
        },
        deleteVitalSignRequest(state, action: PayloadAction<string>) {
            state.deleteStatus = { ...initialStatus, loading: true };
        },
        deleteVitalSignSuccess(state, action: PayloadAction<string>) {
            state.list = state.list.filter((vitalSign) => vitalSign.vitalSignId !== action.payload);
            state.deleteStatus = { ...initialStatus, success: true };
        },
        deleteVitalSignFailure(state, action: PayloadAction<string>) {
            state.deleteStatus = { ...initialStatus, error: action.payload };
        },
        clearVitalSignState(state) {
            state.deleteStatus = { ...initialStatus };
        },
    },
});

export const { fetchVitalSignsRequest, fetchVitalSignsSuccess, fetchVitalSignsFailure,
    fetchVitalSignDetailRequest, fetchVitalSignDetailSuccess, fetchVitalSignDetailFailure,
    createVitalSignRequest, createVitalSignSuccess, createVitalSignFailure,
    updateVitalSignRequest, updateVitalSignSuccess, updateVitalSignFailure,
    updateVitalSignScheduleRequest, updateVitalSignScheduleSuccess, updateVitalSignScheduleFailure,
    deleteVitalSignRequest, deleteVitalSignSuccess, deleteVitalSignFailure,
    clearVitalSignState } = vitalSignSlice.actions;
export default vitalSignSlice.reducer;

// ----- Selector -----
// 등록 전제: rootReducer 에 inpatient: combineReducers({ bedreservation }) (features/inpatient/slice.ts)
type VitalSignRoot = { inpatient: { vitalsign: VitalSignState } };

export const selectVitalSigns = (state: VitalSignRoot) =>
  state.inpatient.vitalsign.list;
export const selectVitalSignListStatus = (state: VitalSignRoot) =>
  state.inpatient.vitalsign.listStatus;
export const selectVitalSignDetail = (state: VitalSignRoot) =>
  state.inpatient.vitalsign.detail;
export const selectVitalSignDetailStatus = (state: VitalSignRoot) =>
  state.inpatient.vitalsign.detailStatus;
export const selectVitalSignCreateStatus = (state: VitalSignRoot) =>
  state.inpatient.vitalsign.createStatus;
export const selectVitalSignUpdateStatus = (state: VitalSignRoot) =>
  state.inpatient.vitalsign.updateStatus;
export const selectVitalSignScheduleUpdateStatus = (state: VitalSignRoot) =>
  state.inpatient.vitalsign.scheduleUpdateStatus;
export const selectVitalSignDeleteStatus = (state: VitalSignRoot) =>
  state.inpatient.vitalsign.deleteStatus;