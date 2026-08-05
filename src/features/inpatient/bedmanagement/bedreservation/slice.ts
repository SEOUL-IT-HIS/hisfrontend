import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Status, BedReservationDTO, BedReservationState, RegisterBedReservationRequest, UpdateBedReservationRequest } from "../types";


const initialStatus: Status = { loading: false, error: null, success: false };

const initialState: BedReservationState = {
    list: [],
    detail: null,
    listStatus: { ...initialStatus },
    detailStatus: { ...initialStatus },
    createStatus: { ...initialStatus },
    updateStatus: { ...initialStatus },
    deleteStatus: { ...initialStatus },
};
const bedReservationSlice = createSlice({
    name: "bedReservation",
    initialState,
    reducers: {
        fetchBedReservationsRequest(state) {
            state.listStatus = { ...initialStatus, loading: true };
        },
        fetchBedReservationsSuccess(state, action: PayloadAction<BedReservationDTO[]>) {
            state.list = action.payload;
            state.listStatus = { ...initialStatus, success: true };
        },
        fetchBedReservationsFailure(state, action: PayloadAction<string>) {
            state.listStatus = { ...initialStatus, error: action.payload };
        },
        fetchBedReservationDetailRequest(state, action: PayloadAction<number>) {
            state.detailStatus = { ...initialStatus, loading: true };
        },
        fetchBedReservationDetailSuccess(state, action: PayloadAction<BedReservationDTO>) {
            state.detail = action.payload;
            state.detailStatus = { ...initialStatus, success: true };
        },
        fetchBedReservationDetailFailure(state, action: PayloadAction<string>) {
            state.detailStatus = { ...initialStatus, error: action.payload };
        },
        createBedReservationRequest(state, action: PayloadAction<RegisterBedReservationRequest>) {
            state.createStatus = { ...initialStatus, loading: true };
        },
        createBedReservationSuccess(state, action: PayloadAction<BedReservationDTO>) {
            state.list.push(action.payload);
            state.createStatus = { ...initialStatus, success: true };
        },
        createBedReservationFailure(state, action: PayloadAction<string>) {
            state.createStatus = { ...initialStatus, error: action.payload };
        },
        updateBedReservationRequest(state, action: PayloadAction<UpdateBedReservationRequest>) {
            state.updateStatus = { ...initialStatus, loading: true };
        },
        updateBedReservationSuccess(state, action: PayloadAction<BedReservationDTO>) {
            const index = state.list.findIndex((reservation) => reservation.bedReservationId === action.payload.bedReservationId);
            if (index !== -1) {
                state.list[index] = action.payload;
            }
            state.updateStatus = { ...initialStatus, success: true };
        },
        updateBedReservationFailure(state, action: PayloadAction<string>) {
            state.updateStatus = { ...initialStatus, error: action.payload };
        },
        deleteBedReservationRequest(state, action: PayloadAction<number>) {
            state.deleteStatus = { ...initialStatus, loading: true };
        },
        deleteBedReservationSuccess(state, action: PayloadAction<number>) {
            state.list = state.list.filter((reservation) => reservation.bedReservationId !== action.payload);
            state.deleteStatus = { ...initialStatus, success: true };
        },
        deleteBedReservationFailure(state, action: PayloadAction<string>) {
            state.deleteStatus = { ...initialStatus, error: action.payload };
        }, 
        clearBedReservationState(state) {
            state.deleteStatus = { ...initialStatus };
        },
    },
});

export const { fetchBedReservationsRequest, fetchBedReservationsSuccess, fetchBedReservationsFailure,
    fetchBedReservationDetailRequest, fetchBedReservationDetailSuccess, fetchBedReservationDetailFailure,
    createBedReservationRequest, createBedReservationSuccess, createBedReservationFailure,
    updateBedReservationRequest, updateBedReservationSuccess, updateBedReservationFailure,
    deleteBedReservationRequest, deleteBedReservationSuccess, deleteBedReservationFailure,
    clearBedReservationState } = bedReservationSlice.actions;
export default bedReservationSlice.reducer;

// ----- Selector -----
// 등록 전제: rootReducer 에 inpatient: combineReducers({ bedreservation }) (features/inpatient/slice.ts)
type BedReservationRoot = { inpatient: { bedreservation: BedReservationState } };

export const selectBedReservations = (state: BedReservationRoot) =>
  state.inpatient.bedreservation.list;
export const selectBedReservationListStatus = (state: BedReservationRoot) =>
  state.inpatient.bedreservation.listStatus;
export const selectBedReservationDetail = (state: BedReservationRoot) =>
  state.inpatient.bedreservation.detail;
export const selectBedReservationDetailStatus = (state: BedReservationRoot) =>
  state.inpatient.bedreservation.detailStatus;
export const selectBedReservationCreateStatus = (state: BedReservationRoot) =>
  state.inpatient.bedreservation.createStatus;
export const selectBedReservationUpdateStatus = (state: BedReservationRoot) =>
  state.inpatient.bedreservation.updateStatus;
export const selectBedReservationDeleteStatus = (state: BedReservationRoot) =>
  state.inpatient.bedreservation.deleteStatus;