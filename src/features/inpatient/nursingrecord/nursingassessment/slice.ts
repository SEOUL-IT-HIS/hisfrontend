import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Status, NursingAssessmentDTO, NursingAssessmentState, RegisterNursingAssessmentRequest, UpdateNursingAssessmentRequest } from "../types";


const initialStatus: Status = { loading: false, error: null, success: false };

const initialState: NursingAssessmentState = {
    list: [],
    detail: null,
    listStatus: { ...initialStatus },
    detailStatus: { ...initialStatus },
    createStatus: { ...initialStatus },
    updateStatus: { ...initialStatus },
    deleteStatus: { ...initialStatus },
};
const nursingassessmentSlice = createSlice({
    name: "nursingassessment",
    initialState,
    reducers: {
        fetchNursingAssessmentsRequest(state) {
            state.listStatus = { ...initialStatus, loading: true };
        },
        fetchNursingAssessmentsSuccess(state, action: PayloadAction<NursingAssessmentDTO[]>) {
            state.list = action.payload;
            state.listStatus = { ...initialStatus, success: true };
        },
        fetchNursingAssessmentsFailure(state, action: PayloadAction<string>) {
            state.listStatus = { ...initialStatus, error: action.payload };
        },
        fetchNursingAssessmentDetailRequest(state, action: PayloadAction<string>) {
            state.detailStatus = { ...initialStatus, loading: true };
        },
        fetchNursingAssessmentDetailSuccess(state, action: PayloadAction<NursingAssessmentDTO>) {
            state.detail = action.payload;
            state.detailStatus = { ...initialStatus, success: true };
        },
        fetchNursingAssessmentDetailFailure(state, action: PayloadAction<string>) {
            state.detailStatus = { ...initialStatus, error: action.payload };
        },
        createNursingAssessmentRequest(state, action: PayloadAction<RegisterNursingAssessmentRequest>) {
            state.createStatus = { ...initialStatus, loading: true };
        },
        createNursingAssessmentSuccess(state, action: PayloadAction<NursingAssessmentDTO>) {
            state.list.push(action.payload);
            state.createStatus = { ...initialStatus, success: true };
        },
        createNursingAssessmentFailure(state, action: PayloadAction<string>) {
            state.createStatus = { ...initialStatus, error: action.payload };
        },
        updateNursingAssessmentRequest(state, action: PayloadAction<UpdateNursingAssessmentRequest>) {
            state.updateStatus = { ...initialStatus, loading: true };
        },
        updateNursingAssessmentSuccess(state, action: PayloadAction<NursingAssessmentDTO>) {
            const index = state.list.findIndex((nursingAssessment) => nursingAssessment.nursingAssessmentId === action.payload.nursingAssessmentId);
            if (index !== -1) {
                state.list[index] = action.payload;
            }
            state.updateStatus = { ...initialStatus, success: true };
        },
        updateNursingAssessmentFailure(state, action: PayloadAction<string>) {
            state.updateStatus = { ...initialStatus, error: action.payload };
        },
        deleteNursingAssessmentRequest(state, action: PayloadAction<string>) {
            state.deleteStatus = { ...initialStatus, loading: true };
        },
        deleteNursingAssessmentSuccess(state, action: PayloadAction<string>) {
            state.list = state.list.filter((nursingAssessment) => nursingAssessment.nursingAssessmentId !== action.payload);
            state.deleteStatus = { ...initialStatus, success: true };
        },
        deleteNursingAssessmentFailure(state, action: PayloadAction<string>) {
            state.deleteStatus = { ...initialStatus, error: action.payload };
        },
        clearNursingAssessmentState(state) {
            state.deleteStatus = { ...initialStatus };
        },
        
    },
});

export const { fetchNursingAssessmentsRequest, fetchNursingAssessmentsSuccess, fetchNursingAssessmentsFailure,
    fetchNursingAssessmentDetailRequest, fetchNursingAssessmentDetailSuccess, fetchNursingAssessmentDetailFailure,
    createNursingAssessmentRequest, createNursingAssessmentSuccess, createNursingAssessmentFailure,
    updateNursingAssessmentRequest, updateNursingAssessmentSuccess, updateNursingAssessmentFailure,
    deleteNursingAssessmentRequest, deleteNursingAssessmentSuccess, deleteNursingAssessmentFailure,
    clearNursingAssessmentState } = nursingassessmentSlice.actions;
export default nursingassessmentSlice.reducer;

// ----- Selector -----
// 등록 전제: rootReducer 에 inpatient: combineReducers({ bedreservation }) (features/inpatient/slice.ts)
type NursingAssessmentRoot = { inpatient: { nursingassessment: NursingAssessmentState } };

export const selectNursingAssessments = (state: NursingAssessmentRoot) =>
  state.inpatient.nursingassessment.list;
export const selectNursingAssessmentListStatus = (state: NursingAssessmentRoot) =>
  state.inpatient.nursingassessment.listStatus;
export const selectNursingAssessmentDetail = (state: NursingAssessmentRoot) =>
  state.inpatient.nursingassessment.detail;
export const selectNursingAssessmentDetailStatus = (state: NursingAssessmentRoot) =>
  state.inpatient.nursingassessment.detailStatus;
export const selectNursingAssessmentCreateStatus = (state: NursingAssessmentRoot) =>
  state.inpatient.nursingassessment.createStatus;
export const selectNursingAssessmentUpdateStatus = (state: NursingAssessmentRoot) =>
  state.inpatient.nursingassessment.updateStatus;
export const selectNursingAssessmentDeleteStatus = (state: NursingAssessmentRoot) =>
  state.inpatient.nursingassessment.deleteStatus;