import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { BedState, BedDTO, Status } from "../types";

const initialStatus: Status = { loading: false, error: null, success: false };

const initialState: BedState = {
    list: [],
    detail: null,
    listStatus: { ...initialStatus },
    detailStatus: { ...initialStatus },
};

const bedSlice = createSlice({
    name: "bed",
    initialState,
    reducers: {
        fetchBedRequest(state) {
            state.listStatus = { ...initialStatus, loading: true };
        },
        fetchBedSuccess(state, action: PayloadAction<BedDTO[]>) {
            state.list = action.payload;
            state.listStatus = { ...initialStatus, success: true };
        },
        fetchBedFailure(state, action: PayloadAction<string>) {
            state.listStatus = { ...initialStatus, error: action.payload };
        },
        fetchBedDetailRequest(state, action: PayloadAction<string>) {
            state.detailStatus = { ...initialStatus, loading: true };
        },
        fetchBedDetailSuccess(state, action: PayloadAction<BedDTO>) {
            state.detail = action.payload;
            state.detailStatus = { ...initialStatus, success: true };
        },
        fetchBedDetailFailure(state, action: PayloadAction<string>) {
            state.detailStatus = { ...initialStatus, error: action.payload };
        },
    },
});

export const {
    fetchBedRequest,
    fetchBedSuccess,
    fetchBedFailure,
    fetchBedDetailRequest,
    fetchBedDetailSuccess,
    fetchBedDetailFailure,
} = bedSlice.actions;
export default bedSlice.reducer;

// ----- Selector -----
// 등록 전제: rootReducer 에 inpatient: combineReducers({ bed }) (features/inpatient/slice.ts)
type BedRoot = { inpatient: { bed: BedState } };

export const selectBed = (state: BedRoot) => state.inpatient.bed.list;
export const selectBedListStatus = (state: BedRoot) => state.inpatient.bed.listStatus;
export const selectBedDetail = (state: BedRoot) => state.inpatient.bed.detail;
export const selectBedDetailStatus = (state: BedRoot) => state.inpatient.bed.detailStatus;
