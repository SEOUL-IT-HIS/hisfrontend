import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RegisterBedAssignmentRequest, Status, BedAssignmentState, UpdateBedAssignmentRequest, BedAssignmentDTO } from "./types";


const initialStatus: Status = { loading: false, error: null, success: false };

const initialState: BedAssignmentState = {
    list: [],
    detail: null,
    listStatus: { ...initialStatus },
    detailStatus: { ...initialStatus },
    createStatus: { ...initialStatus },
    updateStatus: { ...initialStatus },
    deleteStatus: { ...initialStatus },
};
const bedAssignmentSlice = createSlice({
    name: "bedAssignment",
    initialState,
    reducers: {
        fetchBedAssignmentsRequest(state) {
            state.listStatus = { ...initialStatus, loading: true };
        },
        fetchBedAssignmentsSuccess(state, action: PayloadAction<BedAssignmentDTO[]>) {
            state.list = action.payload;
            state.listStatus = { ...initialStatus, success: true };
        },
        fetchBedAssignmentsFailure(state, action: PayloadAction<string>) {
            state.listStatus = { ...initialStatus, error: action.payload };
        },
        fetchBedAssignmentDetailRequest(state, action: PayloadAction<string>) {
            state.detailStatus = { ...initialStatus, loading: true };
        },
        fetchBedAssignmentDetailSuccess(state, action: PayloadAction<BedAssignmentDTO>) {
            state.detail = action.payload;
            state.detailStatus = { ...initialStatus, success: true };
        },
        fetchBedAssignmentDetailFailure(state, action: PayloadAction<string>) {
            state.detailStatus = { ...initialStatus, error: action.payload };
        },
        createBedAssignmentRequest(state, action: PayloadAction<RegisterBedAssignmentRequest>) {
            state.createStatus = { ...initialStatus, loading: true };
        },
        createBedAssignmentSuccess(state, action: PayloadAction<BedAssignmentDTO>) {
            state.list.push(action.payload);
            state.createStatus = { ...initialStatus, success: true };
        },
        createBedAssignmentFailure(state, action: PayloadAction<string>) {
            state.createStatus = { ...initialStatus, error: action.payload };
        },
        updateBedAssignmentRequest(state, action: PayloadAction<UpdateBedAssignmentRequest>) {
            state.updateStatus = { ...initialStatus, loading: true };
        },
        updateBedAssignmentSuccess(state, action: PayloadAction<BedAssignmentDTO>) {
            const index = state.list.findIndex((assignment) => assignment.assignmentId === action.payload.assignmentId);
            if (index !== -1) {
                state.list[index] = action.payload;
            }
            state.updateStatus = { ...initialStatus, success: true };
        },
        updateBedAssignmentFailure(state, action: PayloadAction<string>) {
            state.updateStatus = { ...initialStatus, error: action.payload };
        },
        deleteBedAssignmentRequest(state, action: PayloadAction<string>) {
            state.deleteStatus = { ...initialStatus, loading: true };
        },
        deleteBedAssignmentSuccess(state, action: PayloadAction<string>) {
            state.list = state.list.filter((assignment) => assignment.assignmentId !== action.payload);
            state.deleteStatus = { ...initialStatus, success: true };
        },
        deleteBedAssignmentFailure(state, action: PayloadAction<string>) {
            state.deleteStatus = { ...initialStatus, error: action.payload };
        }, 
        clearBedAssignmentState(state) {
            state.deleteStatus = { ...initialStatus };
        },
    },
});

export const { fetchBedAssignmentsRequest, fetchBedAssignmentsSuccess, fetchBedAssignmentsFailure,
    fetchBedAssignmentDetailRequest, fetchBedAssignmentDetailSuccess, fetchBedAssignmentDetailFailure,
    createBedAssignmentRequest, createBedAssignmentSuccess, createBedAssignmentFailure,
    updateBedAssignmentRequest, updateBedAssignmentSuccess, updateBedAssignmentFailure,
    deleteBedAssignmentRequest, deleteBedAssignmentSuccess, deleteBedAssignmentFailure,
    clearBedAssignmentState } = bedAssignmentSlice.actions;
export default bedAssignmentSlice.reducer;

// ----- Selector -----
// 등록 전제: rootReducer 에 inpatient: combineReducers({ bedmanagement }) (features/inpatient/slice.ts)
type BedAssignmentRoot = { inpatient: { bedmanagement: BedAssignmentState } };

export const selectBedAssignments = (state: BedAssignmentRoot) =>
  state.inpatient.bedmanagement.list;
export const selectBedAssignmentListStatus = (state: BedAssignmentRoot) =>
  state.inpatient.bedmanagement.listStatus;
export const selectBedAssignmentDetail = (state: BedAssignmentRoot) =>
  state.inpatient.bedmanagement.detail;
export const selectBedAssignmentDetailStatus = (state: BedAssignmentRoot) =>
  state.inpatient.bedmanagement.detailStatus;
export const selectBedAssignmentCreateStatus = (state: BedAssignmentRoot) =>
  state.inpatient.bedmanagement.createStatus;
export const selectBedAssignmentUpdateStatus = (state: BedAssignmentRoot) =>
  state.inpatient.bedmanagement.updateStatus;
export const selectBedAssignmentDeleteStatus = (state: BedAssignmentRoot) =>
  state.inpatient.bedmanagement.deleteStatus;