import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  LabOrderCreateRequest,
  LabOrderCreateResponse,
  LabOrderState,
  LabReceptionContext,
  LabReceptionDetail,
  LabWorklistItem,
  WorklistStatusFilter,
} from "@/features/labimaging/laborder/types";

/**
 * labOrder(검사 오더 접수 + 접수 조회) slice
 * - 상태만 관리하고 API 호출은 하지 않는다 → saga 가 담당 (가이드 10.3)
 * - createSlice name = "labImaging/laborder" (Action prefix "labImaging/" 유지)
 */
const initialState: LabOrderState = {
  creating: false,
  createError: "",
  lastCreated: null,

  selectedReception: null,
  receptionDetail: null,
  receptionLoading: false,
  receptionError: "",

  worklist: [],
  worklistLoading: false,
  worklistError: "",
  selectedReceptionNo: null,
  exclusionSubmitting: false,
  exclusionError: "",
};

const labOrderSlice = createSlice({
  name: "labImaging/laborder",
  initialState,
  reducers: {
    // ---------- 접수 생성 ----------
    createLabOrderRequest: {
      reducer(state) {
        state.creating = true;
        state.createError = "";
      },
      prepare(request: LabOrderCreateRequest) {
        return { payload: request };
      },
    },
    createLabOrderSuccess(state, action: PayloadAction<LabOrderCreateResponse>) {
      state.creating = false;
      state.createError = "";
      state.lastCreated = action.payload;
    },
    createLabOrderFailure(state, action: PayloadAction<string>) {
      state.creating = false;
      state.createError = action.payload;
    },
    resetLabOrderResult(state) {
      state.createError = "";
      state.lastCreated = null;
    },

    // ---------- 접수 단건 조회 ----------
    fetchLabReceptionByNoRequest: {
      reducer(state) {
        state.receptionLoading = true;
        state.receptionError = "";
        state.receptionDetail = null;
      },
      prepare(receptionNo: string) {
        return { payload: receptionNo };
      },
    },
    fetchLabReceptionByNoSuccess(
      state,
      action: PayloadAction<LabReceptionDetail>,
    ) {
      state.receptionLoading = false;
      state.receptionDetail = action.payload;
    },
    fetchLabReceptionByNoFailure(state, action: PayloadAction<string>) {
      state.receptionLoading = false;
      state.receptionError = action.payload;
    },

    /** 목록에서 클릭으로 고른 접수를 재조회 없이 컨텍스트로 저장 (일정등록 화면 진입용) */
    selectLabReception(state, action: PayloadAction<LabReceptionContext>) {
      state.selectedReception = action.payload;
      state.receptionError = "";
    },
    clearSelectedLabReception(state) {
      state.selectedReception = null;
      state.receptionError = "";
    },

    // ---------- 워크리스트 ----------
    // payload = 필터("ACCEPTED"/"EXCLUDED"/"ALL"). saga 가 읽어 API 파라미터로 넘긴다.
    fetchLabWorklistRequest(
      state,
      _action: PayloadAction<WorklistStatusFilter | undefined>,
    ) {
      state.worklistLoading = true;
      state.worklistError = "";
    },
    fetchLabWorklistSuccess(state, action: PayloadAction<LabWorklistItem[]>) {
      state.worklistLoading = false;
      state.worklist = action.payload;

      /*
       * 갱신된 목록에 선택했던 접수가 없으면 선택을 푼다.
       * (제외 처리를 하면 "처리 대상" 목록에서 빠지므로 이 경우가 실제로 생긴다)
       */
      if (
        state.selectedReceptionNo &&
        !action.payload.some((item) => item.receptionNo === state.selectedReceptionNo)
      ) {
        state.selectedReceptionNo = null;
      }
    },
    fetchLabWorklistFailure(state, action: PayloadAction<string>) {
      state.worklistLoading = false;
      state.worklistError = action.payload;
    },

    /** 목록에서 행을 고른다. 오른쪽 작업 폼의 대상이 된다. */
    selectWorklistReception(state, action: PayloadAction<string>) {
      state.selectedReceptionNo = action.payload;
      state.exclusionError = "";
    },
    clearWorklistSelection(state) {
      state.selectedReceptionNo = null;
      state.exclusionError = "";
    },

    // ---------- 접수 제외 / 복구 ----------
    /*
     * 처리에 성공하면 목록을 다시 불러와야 하는데, 그때 어떤 필터로 불러올지는
     * 화면이 알고 있다. 그래서 현재 필터를 payload 에 같이 실어 보내고
     * saga 가 이어서 fetchLabWorklistRequest(filter) 를 dispatch 한다.
     */
    excludeReceptionRequest: {
      reducer(state) {
        state.exclusionSubmitting = true;
        state.exclusionError = "";
      },
      prepare(
        receptionNo: string,
        exclusionReason: string,
        filter: WorklistStatusFilter,
      ) {
        return { payload: { receptionNo, exclusionReason, filter } };
      },
    },
    restoreReceptionRequest: {
      reducer(state) {
        state.exclusionSubmitting = true;
        state.exclusionError = "";
      },
      prepare(receptionNo: string, filter: WorklistStatusFilter) {
        return { payload: { receptionNo, filter } };
      },
    },
    /** 제외/복구 성공. 목록 재조회는 saga 가 이어서 dispatch 한다. */
    exclusionSuccess(state) {
      state.exclusionSubmitting = false;
      state.exclusionError = "";
    },
    exclusionFailure(state, action: PayloadAction<string>) {
      state.exclusionSubmitting = false;
      state.exclusionError = action.payload;
    },
  },
});

export const {
  createLabOrderRequest,
  createLabOrderSuccess,
  createLabOrderFailure,
  resetLabOrderResult,
  fetchLabReceptionByNoRequest,
  fetchLabReceptionByNoSuccess,
  fetchLabReceptionByNoFailure,
  selectLabReception,
  clearSelectedLabReception,
  fetchLabWorklistRequest,
  fetchLabWorklistSuccess,
  fetchLabWorklistFailure,
  selectWorklistReception,
  clearWorklistSelection,
  excludeReceptionRequest,
  restoreReceptionRequest,
  exclusionSuccess,
  exclusionFailure,
} = labOrderSlice.actions;

export default labOrderSlice.reducer;

// ----- Selector (가이드 10.4: 컴포넌트에서 state.xxx.yyy 깊게 접근 금지) -----
type LabOrderRoot = { labImaging: { laborder: LabOrderState } };

export const selectLabOrderCreating = (s: LabOrderRoot) =>
  s.labImaging.laborder.creating;
export const selectLabOrderCreateError = (s: LabOrderRoot) =>
  s.labImaging.laborder.createError;
export const selectLastCreatedLabOrder = (s: LabOrderRoot) =>
  s.labImaging.laborder.lastCreated;

export const selectSelectedLabReception = (s: LabOrderRoot) =>
  s.labImaging.laborder.selectedReception;
export const selectLabReceptionLoading = (s: LabOrderRoot) =>
  s.labImaging.laborder.receptionLoading;
export const selectLabReceptionError = (s: LabOrderRoot) =>
  s.labImaging.laborder.receptionError;

export const selectLabReceptionDetail = (s: LabOrderRoot) =>
  s.labImaging.laborder.receptionDetail;

export const selectLabWorklist = (s: LabOrderRoot) =>
  s.labImaging.laborder.worklist;
export const selectLabWorklistLoading = (s: LabOrderRoot) =>
  s.labImaging.laborder.worklistLoading;
export const selectLabWorklistError = (s: LabOrderRoot) =>
  s.labImaging.laborder.worklistError;

export const selectSelectedReceptionNo = (s: LabOrderRoot) =>
  s.labImaging.laborder.selectedReceptionNo;

export const selectExclusionSubmitting = (s: LabOrderRoot) =>
  s.labImaging.laborder.exclusionSubmitting;
export const selectExclusionError = (s: LabOrderRoot) =>
  s.labImaging.laborder.exclusionError;
