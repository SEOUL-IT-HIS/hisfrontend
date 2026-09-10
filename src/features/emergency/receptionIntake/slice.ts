import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  ReceptionIntake,
  ReceptionIntakeCreateRequest,
  ReceptionIntakeState,
} from "@/features/emergency/receptionIntake/types";

/** receptionIntake(응급접수 정보 수신) slice — UC-CARE-01 보조 */
const initialState: ReceptionIntakeState = {
  submitting: false,
  submitError: "",
  lastIntake: null,
};

const receptionIntakeSlice = createSlice({
  name: "emergency/receptionIntake",
  initialState,
  reducers: {
    createReceptionIntakeRequest: {
      reducer(state) {
        state.submitting = true;
        state.submitError = "";
      },
      prepare(request: ReceptionIntakeCreateRequest) {
        return { payload: request };
      },
    },
    createReceptionIntakeSuccess(state, action: PayloadAction<ReceptionIntake>) {
      state.submitting = false;
      state.submitError = "";
      state.lastIntake = action.payload;
    },
    createReceptionIntakeFailure(state, action: PayloadAction<string>) {
      state.submitting = false;
      state.submitError = action.payload;
    },
  },
});

export const {
  createReceptionIntakeRequest,
  createReceptionIntakeSuccess,
  createReceptionIntakeFailure,
} = receptionIntakeSlice.actions;

export default receptionIntakeSlice.reducer;

// ----- Selector (가이드 10.4) -----
type ReceptionIntakeRoot = { emergency: { receptionIntake: ReceptionIntakeState } };

export const selectReceptionIntakeSubmitting = (state: ReceptionIntakeRoot) =>
  state.emergency.receptionIntake.submitting;
export const selectReceptionIntakeSubmitError = (state: ReceptionIntakeRoot) =>
  state.emergency.receptionIntake.submitError;
export const selectLastReceptionIntake = (state: ReceptionIntakeRoot) =>
  state.emergency.receptionIntake.lastIntake;
