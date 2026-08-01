import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  CancelSurgeryRequest,
  RegisterSurgeryRequest,
  ScheduleState,
  Surgery,
  SurgeryListParams,
  UpdateProgressRequest,
  UpdateSurgeryRequest,
} from "@/features/surgery/schedule/types";

/**
 * 수술 스케줄링 slice (SL2-2)
 *
 * <p>상태만 관리하고 API 호출은 saga 가 담당한다(§10.3).
 * createSlice name = "surgery/schedule" (§10.2 서비스 prefix 유지)</p>
 */
const initialState: ScheduleState = {
  surgeries: [],
  todaySurgeries: [],
  selectedSurgery: null,
  loading: false,
  saving: false,
  error: "",
};

const scheduleSlice = createSlice({
  name: "surgery/schedule",
  initialState,
  reducers: {
    // ----- 조회 (SL2-25 목록 / SL2-40 금일현황) -----
    fetchSurgeriesRequest: {
      reducer(state) {
        state.loading = true;
        state.error = "";
      },
      prepare(params?: SurgeryListParams) {
        return { payload: params };
      },
    },
    fetchSurgeriesSuccess(state, action: PayloadAction<Surgery[]>) {
      state.loading = false;
      state.surgeries = action.payload;
    },
    fetchSurgeriesFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    fetchTodaySurgeriesRequest(state) {
      state.loading = true;
      state.error = "";
    },
    fetchTodaySurgeriesSuccess(state, action: PayloadAction<Surgery[]>) {
      state.loading = false;
      state.todaySurgeries = action.payload;
    },
    fetchTodaySurgeriesFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    fetchSurgeryRequest: {
      reducer(state) {
        state.loading = true;
        state.error = "";
      },
      prepare(surgeryId: string) {
        return { payload: surgeryId };
      },
    },
    fetchSurgerySuccess(state, action: PayloadAction<Surgery>) {
      state.loading = false;
      state.selectedSurgery = action.payload;
    },
    fetchSurgeryFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // ----- 등록/수정 (SL2-36 / SL2-44 긴급 / SL2-37) -----
    registerSurgeryRequest: {
      reducer(state) {
        state.saving = true;
        state.error = "";
      },
      prepare(request: RegisterSurgeryRequest) {
        return { payload: request };
      },
    },
    registerEmergencySurgeryRequest: {
      reducer(state) {
        state.saving = true;
        state.error = "";
      },
      prepare(request: RegisterSurgeryRequest) {
        return { payload: request };
      },
    },
    updateSurgeryRequest: {
      reducer(state) {
        state.saving = true;
        state.error = "";
      },
      prepare(surgeryId: string, request: UpdateSurgeryRequest) {
        return { payload: { surgeryId, request } };
      },
    },

    // ----- 상태 전이 (SL2-33 취소 / SL2-39 진행상태 / 시작·종료) -----
    /** 물리 삭제가 아니라 취소 상태 전이다(§21.6) */
    cancelSurgeryRequest: {
      reducer(state) {
        state.saving = true;
        state.error = "";
      },
      prepare(surgeryId: string, request?: CancelSurgeryRequest) {
        return { payload: { surgeryId, request } };
      },
    },
    updateProgressRequest: {
      reducer(state) {
        state.saving = true;
        state.error = "";
      },
      prepare(surgeryId: string, request: UpdateProgressRequest) {
        return { payload: { surgeryId, request } };
      },
    },
    startSurgeryRequest: {
      reducer(state) {
        state.saving = true;
        state.error = "";
      },
      prepare(surgeryId: string) {
        return { payload: surgeryId };
      },
    },
    endSurgeryRequest: {
      reducer(state) {
        state.saving = true;
        state.error = "";
      },
      prepare(surgeryId: string) {
        return { payload: surgeryId };
      },
    },

    /** 등록·수정·상태전이 공통 성공 — saga 가 목록을 다시 불러온다 */
    surgeryMutationSuccess(state) {
      state.saving = false;
      state.error = "";
    },
    surgeryMutationFailure(state, action: PayloadAction<string>) {
      state.saving = false;
      state.error = action.payload;
    },

    resetScheduleState() {
      return initialState;
    },
  },
});

export const {
  fetchSurgeriesRequest,
  fetchSurgeriesSuccess,
  fetchSurgeriesFailure,
  fetchTodaySurgeriesRequest,
  fetchTodaySurgeriesSuccess,
  fetchTodaySurgeriesFailure,
  fetchSurgeryRequest,
  fetchSurgerySuccess,
  fetchSurgeryFailure,
  registerSurgeryRequest,
  registerEmergencySurgeryRequest,
  updateSurgeryRequest,
  cancelSurgeryRequest,
  updateProgressRequest,
  startSurgeryRequest,
  endSurgeryRequest,
  surgeryMutationSuccess,
  surgeryMutationFailure,
  resetScheduleState,
} = scheduleSlice.actions;

export default scheduleSlice.reducer;

// ----- Selector (§10.4) -----
// 등록 전제: rootReducer 에 surgery: combineReducers({ room, schedule, ... })
type ScheduleRoot = { surgery: { schedule: ScheduleState } };

export const selectSurgeries = (state: ScheduleRoot) =>
  state.surgery.schedule.surgeries;
export const selectTodaySurgeries = (state: ScheduleRoot) =>
  state.surgery.schedule.todaySurgeries;
export const selectSelectedSurgery = (state: ScheduleRoot) =>
  state.surgery.schedule.selectedSurgery;
export const selectScheduleLoading = (state: ScheduleRoot) =>
  state.surgery.schedule.loading;
export const selectScheduleSaving = (state: ScheduleRoot) =>
  state.surgery.schedule.saving;
export const selectScheduleError = (state: ScheduleRoot) =>
  state.surgery.schedule.error;
