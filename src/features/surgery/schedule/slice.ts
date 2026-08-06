import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  AssignSurgeryRequest,
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
 *
 * <p><b>액션 패턴</b> — 조회·등록·수정이 모두 세 개 한 벌이다.</p>
 * <pre>
 *   Request  →  loading(또는 saving)=true, error 비움.  saga 가 이 액션을 받아 API 를 호출한다
 *   Success  →  로딩 해제 + 상태 반영
 *   Failure  →  로딩 해제 + error 에 문구 저장
 * </pre>
 * <p>컴포넌트는 <b>Request 만 dispatch</b> 하면 된다. Success/Failure 는 saga 가 흘려보낸다.
 * 화면은 API 주소도, 성공 후 무엇을 해야 하는지도 알 필요가 없다.</p>
 *
 * <p><b>loading 과 saving 을 나눈 이유</b> — 읽기와 쓰기는 화면에서 쓰임이 다르다.
 * loading 은 "불러오는 중…" 문구에, saving 은 버튼·입력칸 비활성화(disabled)에 쓴다.
 * 하나로 묶으면 저장 중에 목록이 통째로 사라진다.</p>
 *
 * <p><b>error 를 null 이 아니라 "" 로 둔 이유</b> — 화면에서 {@code error && <p>...</p>} 로
 * 바로 쓰기 위해서다. 노출 직전 resolveSurgeryMessage 로 SUR### 코드를 문구로 바꾼다(§15.2).</p>
 *
 * <p><b>reducer 안에서 state 를 직접 바꿔도 되는 이유</b> — Redux Toolkit 이 내부적으로
 * Immer 를 쓴다. {@code state.loading = true} 처럼 적어도 실제로는 새 객체를 만드는
 * 코드로 변환되므로, 읽기 쉬운 문법을 쓰면서 불변성 규칙은 지켜진다.</p>
 *
 * <p><b>prepare 가 붙은 액션이 있는 이유</b> — reducer 는 인자를 action 하나만 받는데,
 * "어느 대상을 어떻게 바꿀지"처럼 값이 둘 이상 필요한 경우가 있다. prepare 가 둘을 하나의
 * payload 로 묶어주므로, 컴포넌트에서는 {@code dispatch(액션(id, request))} 처럼 자연스럽게 부른다.</p>
 *
 * <p>surgeries(전체)·todaySurgeries(금일)·surgeryRequests(배정 대기)를 각각 들고 있다.
 * 같은 Surgery 배열이지만 조회 조건이 달라, 한 배열을 돌려쓰면 화면을 오갈 때 목록이 뒤섞인다.</p>
 */
const initialState: ScheduleState = {
  surgeries: [],
  todaySurgeries: [],
  surgeryRequests: [],
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

    // ----- 배정 대기 요청 목록 -----
    /** 진료가 올린 요청 중 아직 수술실이 안 잡힌 건(status_cd = 00) */
    fetchSurgeryRequestsRequest(state) {
      state.loading = true;
      state.error = "";
    },
    fetchSurgeryRequestsSuccess(state, action: PayloadAction<Surgery[]>) {
      state.loading = false;
      state.surgeryRequests = action.payload;
    },
    fetchSurgeryRequestsFailure(state, action: PayloadAction<string>) {
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

    // ----- 배정 (요청접수 → 예약) -----
    assignSurgeryRequest: {
      reducer(state) {
        state.saving = true;
        state.error = "";
      },
      prepare(surgeryId: string, request: AssignSurgeryRequest) {
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
  fetchSurgeryRequestsRequest,
  fetchSurgeryRequestsSuccess,
  fetchSurgeryRequestsFailure,
  fetchSurgeryRequest,
  fetchSurgerySuccess,
  fetchSurgeryFailure,
  registerSurgeryRequest,
  registerEmergencySurgeryRequest,
  updateSurgeryRequest,
  assignSurgeryRequest,
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
export const selectSurgeryRequests = (state: ScheduleRoot) =>
  state.surgery.schedule.surgeryRequests;
export const selectSelectedSurgery = (state: ScheduleRoot) =>
  state.surgery.schedule.selectedSurgery;
export const selectScheduleLoading = (state: ScheduleRoot) =>
  state.surgery.schedule.loading;
export const selectScheduleSaving = (state: ScheduleRoot) =>
  state.surgery.schedule.saving;
export const selectScheduleError = (state: ScheduleRoot) =>
  state.surgery.schedule.error;
