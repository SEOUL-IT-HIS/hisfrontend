import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Status, RiskAssessmentDTO, RiskAssessmentState, RegisterRiskAssessmentRequest, UpdateRiskAssessmentRequest } from "../types";


const initialStatus: Status = { loading: false, error: null, success: false };

const initialState: RiskAssessmentState = {
    list: [],
    detail: null,
    listStatus: { ...initialStatus },
    detailStatus: { ...initialStatus },
    createStatus: { ...initialStatus },
    updateStatus: { ...initialStatus },
    deleteStatus: { ...initialStatus },
};
const riskAssessmentSlice = createSlice({
    name: "riskAssessment",
    initialState,
    reducers: {
        fetchRiskAssessmentsRequest(state) {
            state.listStatus = { ...initialStatus, loading: true };
        },
        fetchRiskAssessmentsSuccess(state, action: PayloadAction<RiskAssessmentDTO[]>) {
            state.list = action.payload;
            state.listStatus = { ...initialStatus, success: true };
        },
        fetchRiskAssessmentsFailure(state, action: PayloadAction<string>) {
            state.listStatus = { ...initialStatus, error: action.payload };
        },
        fetchRiskAssessmentDetailRequest(state, action: PayloadAction<string>) {
            state.detailStatus = { ...initialStatus, loading: true };
        },
        fetchRiskAssessmentDetailSuccess(state, action: PayloadAction<RiskAssessmentDTO>) {
            state.detail = action.payload;
            state.detailStatus = { ...initialStatus, success: true };
        },
        fetchRiskAssessmentDetailFailure(state, action: PayloadAction<string>) {
            state.detailStatus = { ...initialStatus, error: action.payload };
        },
        createRiskAssessmentRequest(state, action: PayloadAction<RegisterRiskAssessmentRequest>) {
            state.createStatus = { ...initialStatus, loading: true };
        },
        createRiskAssessmentSuccess(state, action: PayloadAction<RiskAssessmentDTO>) {
            state.list.push(action.payload);
            state.createStatus = { ...initialStatus, success: true };
        },
        createRiskAssessmentFailure(state, action: PayloadAction<string>) {
            state.createStatus = { ...initialStatus, error: action.payload };
        },
        updateRiskAssessmentRequest(state, action: PayloadAction<UpdateRiskAssessmentRequest>) {
            state.updateStatus = { ...initialStatus, loading: true };
        },
        updateRiskAssessmentSuccess(state, action: PayloadAction<RiskAssessmentDTO>) {
            const index = state.list.findIndex((riskAssessment) => riskAssessment.patientRiskAssessmentId === action.payload.patientRiskAssessmentId);
            if (index !== -1) {
                state.list[index] = action.payload;
            }
            state.updateStatus = { ...initialStatus, success: true };
        },
        updateRiskAssessmentFailure(state, action: PayloadAction<string>) {
            state.updateStatus = { ...initialStatus, error: action.payload };
        },
        deleteRiskAssessmentRequest(state, action: PayloadAction<string>) {
            state.deleteStatus = { ...initialStatus, loading: true };
        },
        deleteRiskAssessmentSuccess(state, action: PayloadAction<string>) {
            state.list = state.list.filter((riskAssessment) => riskAssessment.patientRiskAssessmentId !== action.payload);
            state.deleteStatus = { ...initialStatus, success: true };
        },
        deleteRiskAssessmentFailure(state, action: PayloadAction<string>) {
            state.deleteStatus = { ...initialStatus, error: action.payload };
        },
        clearRiskAssessmentState(state) {
            state.deleteStatus = { ...initialStatus };
        },
        
    },
});

export const { fetchRiskAssessmentsRequest, fetchRiskAssessmentsSuccess, fetchRiskAssessmentsFailure,
    fetchRiskAssessmentDetailRequest, fetchRiskAssessmentDetailSuccess, fetchRiskAssessmentDetailFailure,
    createRiskAssessmentRequest, createRiskAssessmentSuccess, createRiskAssessmentFailure,
    updateRiskAssessmentRequest, updateRiskAssessmentSuccess, updateRiskAssessmentFailure,
    deleteRiskAssessmentRequest, deleteRiskAssessmentSuccess, deleteRiskAssessmentFailure,
    clearRiskAssessmentState } = riskAssessmentSlice.actions;
export default riskAssessmentSlice.reducer;

// ----- Selector -----
// 등록 전제: rootReducer 에 inpatient: combineReducers({ bedreservation }) (features/inpatient/slice.ts)
type RiskAssessmentRoot = { inpatient: { riskassessment: RiskAssessmentState } };

export const selectRiskAssessments = (state: RiskAssessmentRoot) =>
  state.inpatient.riskassessment.list;
export const selectRiskAssessmentListStatus = (state: RiskAssessmentRoot) =>
  state.inpatient.riskassessment.listStatus;
export const selectRiskAssessmentDetail = (state: RiskAssessmentRoot) =>
  state.inpatient.riskassessment.detail;
export const selectRiskAssessmentDetailStatus = (state: RiskAssessmentRoot) =>
  state.inpatient.riskassessment.detailStatus;
export const selectRiskAssessmentCreateStatus = (state: RiskAssessmentRoot) =>
  state.inpatient.riskassessment.createStatus;
export const selectRiskAssessmentUpdateStatus = (state: RiskAssessmentRoot) =>
  state.inpatient.riskassessment.updateStatus;
export const selectRiskAssessmentDeleteStatus = (state: RiskAssessmentRoot) =>
  state.inpatient.riskassessment.deleteStatus;