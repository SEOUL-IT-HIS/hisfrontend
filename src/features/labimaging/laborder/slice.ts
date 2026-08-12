import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  LabOrderCreateRequest,
  LabOrderCreateResponse,
  LabOrderState,
  LabReceptionContext,
  LabReceptionDetail,
  LabReceptionSummary,
  ReceptionScheduledFilter,
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

  receptions: [],
  receptionsLoading: false,
  receptionsError: "",

  selectedReception: null,
  receptionDetail: null,
  receptionLoading: false,
  receptionError: "",
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

    // ---------- 접수 목록(미일정) 조회 ----------
    // payload = 필터("ALL"/"Y"/"N"). saga 가 읽어 API 파라미터로 넘긴다.
    fetchLabReceptionsRequest(
      state,
      _action: PayloadAction<ReceptionScheduledFilter | undefined>,
    ) {
      state.receptionsLoading = true;
      state.receptionsError = "";
    },
    fetchLabReceptionsSuccess(
      state,
      action: PayloadAction<LabReceptionSummary[]>,
    ) {
      state.receptionsLoading = false;
      state.receptions = action.payload;
    },
    fetchLabReceptionsFailure(state, action: PayloadAction<string>) {
      state.receptionsLoading = false;
      state.receptionsError = action.payload;
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
  },
});

export const {
  createLabOrderRequest,
  createLabOrderSuccess,
  createLabOrderFailure,
  resetLabOrderResult,
  fetchLabReceptionsRequest,
  fetchLabReceptionsSuccess,
  fetchLabReceptionsFailure,
  fetchLabReceptionByNoRequest,
  fetchLabReceptionByNoSuccess,
  fetchLabReceptionByNoFailure,
  selectLabReception,
  clearSelectedLabReception,
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

export const selectLabReceptions = (s: LabOrderRoot) =>
  s.labImaging.laborder.receptions;
export const selectLabReceptionsLoading = (s: LabOrderRoot) =>
  s.labImaging.laborder.receptionsLoading;
export const selectLabReceptionsError = (s: LabOrderRoot) =>
  s.labImaging.laborder.receptionsError;

export const selectSelectedLabReception = (s: LabOrderRoot) =>
  s.labImaging.laborder.selectedReception;
export const selectLabReceptionLoading = (s: LabOrderRoot) =>
  s.labImaging.laborder.receptionLoading;
export const selectLabReceptionError = (s: LabOrderRoot) =>
  s.labImaging.laborder.receptionError;

export const selectLabReceptionDetail = (s: LabOrderRoot) =>
  s.labImaging.laborder.receptionDetail;
