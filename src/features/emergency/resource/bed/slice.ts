import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  Bed,
  BedAssignment,
  BedAssignmentCreateRequest,
  BedReleaseRequest,
  BedState,
} from "@/features/emergency/resource/bed/types";

/** bed(병상 배정) slice — UC-RES-02 */
const initialState: BedState = {
  beds: [],
  loading: false,
  error: "",
  currentAssignment: null,
  submitting: false,
  submitError: "",
};

const bedSlice = createSlice({
  name: "emergency/bed",
  initialState,
  reducers: {
    fetchBedsRequest(state) {
      state.loading = true;
      state.error = "";
    },
    fetchBedsSuccess(state, action: PayloadAction<Bed[]>) {
      state.loading = false;
      state.error = "";
      state.beds = action.payload;
    },
    fetchBedsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    assignBedRequest: {
      reducer(state) {
        state.submitting = true;
        state.submitError = "";
      },
      prepare(request: BedAssignmentCreateRequest) {
        return { payload: request };
      },
    },
    assignBedSuccess(state, action: PayloadAction<BedAssignment>) {
      state.submitting = false;
      state.submitError = "";
      state.currentAssignment = action.payload;
    },
    assignBedFailure(state, action: PayloadAction<string>) {
      state.submitting = false;
      state.submitError = action.payload;
    },
    releaseBedRequest: {
      reducer(state) {
        state.submitting = true;
        state.submitError = "";
      },
      prepare(assignmentId: string, request: BedReleaseRequest) {
        return { payload: { assignmentId, request } };
      },
    },
    // 해제 성공하면 더 보여줄 게 없으니(병상 현황판이 이미 EMPTY로 갱신됨) 배정 표시를 지운다.
    releaseBedSuccess(state) {
      state.submitting = false;
      state.submitError = "";
      state.currentAssignment = null;
    },
    releaseBedFailure(state, action: PayloadAction<string>) {
      state.submitting = false;
      state.submitError = action.payload;
    },
    // 환자를 바꾸면 이전 환자의 배정 표시를 지우고, 백엔드에서 그 환자의 현재 배정을 다시 불러온다
    resetCurrentAssignment(state) {
      state.currentAssignment = null;
    },
    fetchCurrentAssignmentRequest: {
      reducer() {},
      prepare(receptionId: string) {
        return { payload: receptionId };
      },
    },
    // 배정이 없으면 null — 이 경우 Release 표시도 없다
    fetchCurrentAssignmentSuccess(state, action: PayloadAction<BedAssignment | null>) {
      state.currentAssignment = action.payload;
    },
  },
});

export const {
  fetchBedsRequest,
  fetchBedsSuccess,
  fetchBedsFailure,
  assignBedRequest,
  assignBedSuccess,
  assignBedFailure,
  releaseBedRequest,
  releaseBedSuccess,
  releaseBedFailure,
  resetCurrentAssignment,
  fetchCurrentAssignmentRequest,
  fetchCurrentAssignmentSuccess,
} = bedSlice.actions;

export default bedSlice.reducer;

// ----- Selector (가이드 10.4) -----
type BedRoot = { emergency: { bed: BedState } };

export const selectBeds = (state: BedRoot) => state.emergency.bed.beds;
export const selectBedsLoading = (state: BedRoot) => state.emergency.bed.loading;
export const selectBedsError = (state: BedRoot) => state.emergency.bed.error;
export const selectCurrentBedAssignment = (state: BedRoot) => state.emergency.bed.currentAssignment;
export const selectBedSubmitting = (state: BedRoot) => state.emergency.bed.submitting;
export const selectBedSubmitError = (state: BedRoot) => state.emergency.bed.submitError;
