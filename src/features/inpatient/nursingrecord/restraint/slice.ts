import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Status, RestraintDTO, RestraintState, RegisterRestraintRequest, UpdateRestraintRequest } from "../types";


const initialStatus: Status = { loading: false, error: null, success: false };

const initialState: RestraintState = {
    list: [],
    detail: null,
    listStatus: { ...initialStatus },
    detailStatus: { ...initialStatus },
    createStatus: { ...initialStatus },
    updateStatus: { ...initialStatus },
    deleteStatus: { ...initialStatus },
};
const restraintSlice = createSlice({
    name: "restraint",
    initialState,
    reducers: {
        fetchRestraintsRequest(state) {
            state.listStatus = { ...initialStatus, loading: true };
        },
        fetchRestraintsSuccess(state, action: PayloadAction<RestraintDTO[]>) {
            state.list = action.payload;
            state.listStatus = { ...initialStatus, success: true };
        },
        fetchRestraintsFailure(state, action: PayloadAction<string>) {
            state.listStatus = { ...initialStatus, error: action.payload };
        },
        fetchRestraintDetailRequest(state, action: PayloadAction<string>) {
            state.detailStatus = { ...initialStatus, loading: true };
        },
        fetchRestraintDetailSuccess(state, action: PayloadAction<RestraintDTO>) {
            state.detail = action.payload;
            state.detailStatus = { ...initialStatus, success: true };
        },
        fetchRestraintDetailFailure(state, action: PayloadAction<string>) {
            state.detailStatus = { ...initialStatus, error: action.payload };
        },
        createRestraintRequest(state, action: PayloadAction<RegisterRestraintRequest>) {
            state.createStatus = { ...initialStatus, loading: true };
        },
        createRestraintSuccess(state, action: PayloadAction<RestraintDTO>) {
            state.list.push(action.payload);
            state.createStatus = { ...initialStatus, success: true };
        },
        createRestraintFailure(state, action: PayloadAction<string>) {
            state.createStatus = { ...initialStatus, error: action.payload };
        },
        updateRestraintRequest(state, action: PayloadAction<UpdateRestraintRequest>) {
            state.updateStatus = { ...initialStatus, loading: true };
        },
        updateRestraintSuccess(state, action: PayloadAction<RestraintDTO>) {
            const index = state.list.findIndex((restraint) => restraint.restraintId === action.payload.restraintId);
            if (index !== -1) {
                state.list[index] = action.payload;
            }
            state.updateStatus = { ...initialStatus, success: true };
        },
        updateRestraintFailure(state, action: PayloadAction<string>) {
            state.updateStatus = { ...initialStatus, error: action.payload };
        },
        deleteRestraintRequest(state, action: PayloadAction<string>) {
            state.deleteStatus = { ...initialStatus, loading: true };
        },
        deleteRestraintSuccess(state, action: PayloadAction<string>) {
            state.list = state.list.filter((restraint) => restraint.restraintId !== action.payload);
            state.deleteStatus = { ...initialStatus, success: true };
        },
        deleteRestraintFailure(state, action: PayloadAction<string>) {
            state.deleteStatus = { ...initialStatus, error: action.payload };
        },
        clearRestraintState(state) {
            state.deleteStatus = { ...initialStatus };
        },
        
    },
});

export const { fetchRestraintsRequest, fetchRestraintsSuccess, fetchRestraintsFailure,
    fetchRestraintDetailRequest, fetchRestraintDetailSuccess, fetchRestraintDetailFailure,
    createRestraintRequest, createRestraintSuccess, createRestraintFailure,
    updateRestraintRequest, updateRestraintSuccess, updateRestraintFailure,
    deleteRestraintRequest, deleteRestraintSuccess, deleteRestraintFailure,
    clearRestraintState } = restraintSlice.actions;
export default restraintSlice.reducer;

// ----- Selector -----
// 등록 전제: rootReducer 에 inpatient: combineReducers({ bedreservation }) (features/inpatient/slice.ts)
type RestraintRoot = { inpatient: { restraint: RestraintState } };

export const selectRestraints = (state: RestraintRoot) =>
  state.inpatient.restraint.list;
export const selectRestraintListStatus = (state: RestraintRoot) =>
  state.inpatient.restraint.listStatus;
export const selectRestraintDetail = (state: RestraintRoot) =>
  state.inpatient.restraint.detail;
export const selectRestraintDetailStatus = (state: RestraintRoot) =>
  state.inpatient.restraint.detailStatus;
export const selectRestraintCreateStatus = (state: RestraintRoot) =>
  state.inpatient.restraint.createStatus;
export const selectRestraintUpdateStatus = (state: RestraintRoot) =>
  state.inpatient.restraint.updateStatus;
export const selectRestraintDeleteStatus = (state: RestraintRoot) =>
  state.inpatient.restraint.deleteStatus;