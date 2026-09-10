import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Status, RegisterIandORecordRequest, UpdateIandORecordRequest, IandORecordDTO, IandORecordState } from "../types";


const initialStatus: Status = { loading: false, error: null, success: false };

const initialState: IandORecordState = {
    list: [],
    detail: null,
    listStatus: { ...initialStatus },
    detailStatus: { ...initialStatus },
    createStatus: { ...initialStatus },
    updateStatus: { ...initialStatus },
    deleteStatus: { ...initialStatus },
};
const iandorecordSlice = createSlice({
    name: "iandorecord",
    initialState,
    reducers: {
        fetchIandORecordsRequest(state) {
            state.listStatus = { ...initialStatus, loading: true };
        },
        fetchIandORecordsSuccess(state, action: PayloadAction<IandORecordDTO[]>) {
            state.list = action.payload;
            state.listStatus = { ...initialStatus, success: true };
        },
        fetchIandORecordsFailure(state, action: PayloadAction<string>) {
            state.listStatus = { ...initialStatus, error: action.payload };
        },
        fetchIandORecordDetailRequest(state, action: PayloadAction<string>) {
            state.detailStatus = { ...initialStatus, loading: true };
        },
        fetchIandORecordDetailSuccess(state, action: PayloadAction<IandORecordDTO>) {
            state.detail = action.payload;
            state.detailStatus = { ...initialStatus, success: true };
        },
        fetchIandORecordDetailFailure(state, action: PayloadAction<string>) {
            state.detailStatus = { ...initialStatus, error: action.payload };
        },
        createIandORecordRequest(state, action: PayloadAction<RegisterIandORecordRequest>) {
            state.createStatus = { ...initialStatus, loading: true };
        },
        createIandORecordSuccess(state, action: PayloadAction<IandORecordDTO>) {
            state.list.push(action.payload);
            state.createStatus = { ...initialStatus, success: true };
        },
        createIandORecordFailure(state, action: PayloadAction<string>) {
            state.createStatus = { ...initialStatus, error: action.payload };
        },
        updateIandORecordRequest(state, action: PayloadAction<UpdateIandORecordRequest>) {
            state.updateStatus = { ...initialStatus, loading: true };
        },
        updateIandORecordSuccess(state, action: PayloadAction<IandORecordDTO>) {
            const index = state.list.findIndex((iandorecord) => iandorecord.intakeOutputId === action.payload.intakeOutputId);
            if (index !== -1) {
                state.list[index] = action.payload;
            }
            state.updateStatus = { ...initialStatus, success: true };
        },
        updateIandORecordFailure(state, action: PayloadAction<string>) {
            state.updateStatus = { ...initialStatus, error: action.payload };
        },
        deleteIandORecordRequest(state, action: PayloadAction<string>) {
            state.deleteStatus = { ...initialStatus, loading: true };
        },
        deleteIandORecordSuccess(state, action: PayloadAction<string>) {
            state.list = state.list.filter((iandorecord) => iandorecord.intakeOutputId !== action.payload);
            state.deleteStatus = { ...initialStatus, success: true };
        },
        deleteIandORecordFailure(state, action: PayloadAction<string>) {
            state.deleteStatus = { ...initialStatus, error: action.payload };
        },
        clearIandORecordState(state) {
            state.deleteStatus = { ...initialStatus };
        },
        
    },
});

export const { fetchIandORecordsRequest, fetchIandORecordsSuccess, fetchIandORecordsFailure,
    fetchIandORecordDetailRequest, fetchIandORecordDetailSuccess, fetchIandORecordDetailFailure,
    createIandORecordRequest, createIandORecordSuccess, createIandORecordFailure,
    updateIandORecordRequest, updateIandORecordSuccess, updateIandORecordFailure,
    deleteIandORecordRequest, deleteIandORecordSuccess, deleteIandORecordFailure,
    clearIandORecordState } = iandorecordSlice.actions;
export default iandorecordSlice.reducer;

// ----- Selector -----
// 등록 전제: rootReducer 에 inpatient: combineReducers({ bedreservation }) (features/inpatient/slice.ts)
type IandORecordRoot = { inpatient: { iandorecord: IandORecordState } };

export const selectIandORecords = (state: IandORecordRoot) =>
  state.inpatient.iandorecord.list;
export const selectIandORecordListStatus = (state: IandORecordRoot) =>
  state.inpatient.iandorecord.listStatus;
export const selectIandORecordDetail = (state: IandORecordRoot) =>
  state.inpatient.iandorecord.detail;
export const selectIandORecordDetailStatus = (state: IandORecordRoot) =>
  state.inpatient.iandorecord.detailStatus;
export const selectIandORecordCreateStatus = (state: IandORecordRoot) =>
  state.inpatient.iandorecord.createStatus;
export const selectIandORecordUpdateStatus = (state: IandORecordRoot) =>
  state.inpatient.iandorecord.updateStatus;
export const selectIandORecordDeleteStatus = (state: IandORecordRoot) =>
  state.inpatient.iandorecord.deleteStatus;