import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { 
    LabScheduleResponse, LabScheduleState, LabScheduleCreateRequest, 
    LabScheduleRescheduleRequest
} from "@/features/labimaging/labschedule/types";

const initialState: LabScheduleState = {
  creating: false,
  createError: "",
  lastCreated: null,
};

const labScheduleSlice = createSlice({
  name: "labImaging/labschedule",
  initialState,
  reducers: {

    createLabScheduleRequest: {
      reducer(state) {
        state.creating = true;
        state.createError = "";
      },
      prepare(request: LabScheduleCreateRequest) {
        return { payload: request };
      },
    },

    createLabScheduleSuccess(state, action: PayloadAction<LabScheduleResponse>) {
      state.creating = false;
      state.createError = "";
      state.lastCreated = action.payload;
    },

    createLabScheduleFailure(state, action: PayloadAction<string>) {
      state.creating = false;
      state.createError = action.payload;
    },

    resetLabScheduleResult(state) {
      state.createError = "";
      state.lastCreated = null;
    },

    rescheduleLabScheduleRequest: {
      reducer(state) {
        state.creating = true;
        state.createError = "";
      },
      prepare(labReceptionId: string, request: LabScheduleRescheduleRequest) {
        return { payload: { labReceptionId, request } };
      },
    },

    rescheduleLabScheduleSuccess(state, action: PayloadAction<LabScheduleResponse>) {
      state.creating = false;
      state.createError = "";
      state.lastCreated = action.payload;
    },

    rescheduleLabScheduleFailure(state, action: PayloadAction<string>) {
      state.creating = false;
      state.createError = action.payload;
    },
  },
});

export const {
  createLabScheduleRequest,
  createLabScheduleSuccess,
  createLabScheduleFailure,
  resetLabScheduleResult,
  rescheduleLabScheduleRequest,
  rescheduleLabScheduleSuccess,
  rescheduleLabScheduleFailure,
} = labScheduleSlice.actions;

export default labScheduleSlice.reducer;

type LabScheduleRoot = { labImaging: { labschedule: LabScheduleState } };

export const selectLabScheduleCreating = (state: LabScheduleRoot) =>
  state.labImaging.labschedule.creating;
export const selectLabScheduleCreateError = (state: LabScheduleRoot) =>
  state.labImaging.labschedule.createError;
export const selectLastCreatedLabSchedule = (state: LabScheduleRoot) =>
  state.labImaging.labschedule.lastCreated;
