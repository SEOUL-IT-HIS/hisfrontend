import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  AdmissionCreateRequest,
  AdmissionRequest,
  FollowUpState,
  TransferNote,
  TransferNoteCreateRequest,
} from "@/features/emergency/disposition/followup/types";

/** disposition follow-up(입원 요청·전원 소견서) slice — UC-DISP-02/03 */
const initialState: FollowUpState = {
  admissionsByDispositionId: {},
  transfersByDispositionId: {},
  loading: false,
  error: "",
  submitting: false,
  submitError: "",
};

const followUpSlice = createSlice({
  name: "emergency/dispositionFollowUp",
  initialState,
  reducers: {
    fetchAdmissionsRequest: {
      reducer(state) {
        state.loading = true;
        state.error = "";
      },
      prepare(dispositionId: string) {
        return { payload: dispositionId };
      },
    },
    fetchAdmissionsSuccess(state, action: PayloadAction<{ dispositionId: string; items: AdmissionRequest[] }>) {
      state.loading = false;
      state.admissionsByDispositionId[action.payload.dispositionId] = action.payload.items;
    },
    createAdmissionRequestAction: {
      reducer(state) {
        state.submitting = true;
        state.submitError = "";
      },
      prepare(dispositionId: string, request: AdmissionCreateRequest) {
        return { payload: { dispositionId, request } };
      },
    },
    createAdmissionSuccess(state, action: PayloadAction<AdmissionRequest>) {
      state.submitting = false;
      const list = state.admissionsByDispositionId[action.payload.dispositionId] ?? [];
      state.admissionsByDispositionId[action.payload.dispositionId] = [action.payload, ...list];
    },
    fetchTransfersRequest: {
      reducer(state) {
        state.loading = true;
        state.error = "";
      },
      prepare(dispositionId: string) {
        return { payload: dispositionId };
      },
    },
    fetchTransfersSuccess(state, action: PayloadAction<{ dispositionId: string; items: TransferNote[] }>) {
      state.loading = false;
      state.transfersByDispositionId[action.payload.dispositionId] = action.payload.items;
    },
    createTransferNoteAction: {
      reducer(state) {
        state.submitting = true;
        state.submitError = "";
      },
      prepare(dispositionId: string, request: TransferNoteCreateRequest) {
        return { payload: { dispositionId, request } };
      },
    },
    createTransferSuccess(state, action: PayloadAction<TransferNote>) {
      state.submitting = false;
      const list = state.transfersByDispositionId[action.payload.dispositionId] ?? [];
      state.transfersByDispositionId[action.payload.dispositionId] = [action.payload, ...list];
    },
    followUpFetchFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    followUpSubmitFailure(state, action: PayloadAction<string>) {
      state.submitting = false;
      state.submitError = action.payload;
    },
  },
});

export const {
  fetchAdmissionsRequest,
  fetchAdmissionsSuccess,
  createAdmissionRequestAction,
  createAdmissionSuccess,
  fetchTransfersRequest,
  fetchTransfersSuccess,
  createTransferNoteAction,
  createTransferSuccess,
  followUpFetchFailure,
  followUpSubmitFailure,
} = followUpSlice.actions;

export default followUpSlice.reducer;

type FollowUpRoot = { emergency: { followUp: FollowUpState } };

export const selectAdmissionsByDisposition = (dispositionId: string) => (state: FollowUpRoot) =>
  state.emergency.followUp.admissionsByDispositionId[dispositionId] ?? [];
export const selectTransfersByDisposition = (dispositionId: string) => (state: FollowUpRoot) =>
  state.emergency.followUp.transfersByDispositionId[dispositionId] ?? [];
export const selectFollowUpLoading = (state: FollowUpRoot) => state.emergency.followUp.loading;
export const selectFollowUpError = (state: FollowUpRoot) => state.emergency.followUp.error;
export const selectFollowUpSubmitting = (state: FollowUpRoot) => state.emergency.followUp.submitting;
export const selectFollowUpSubmitError = (state: FollowUpRoot) => state.emergency.followUp.submitError;
