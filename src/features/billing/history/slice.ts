import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SearchPatient, SearchPatientResult, BillingHistoryItem } from "./types";

/**
 * billingHistory slice
 * - 검색(searchStatus) / 검색 리스트(searchList) / 상세조회(detailStatus, detail) 세 갈래만 관리
 * - API 호출은 여기서 하지 않는다 → saga 가 담당
 */
type StatusState = { loading: boolean; error: string };

const initialStatus: StatusState = { loading: false, error: "" };

type BillingHistoryState = {
  /** 환자 이름 검색 결과 리스트 */
  searchList: SearchPatientResult[];
  /** 검색(searchList 채우는) 요청 상태 */
  searchStatus: StatusState;

  /** 선택한 환자의 수납이력 리스트 (한 환자가 여러 건일 수 있음) */
  detail: BillingHistoryItem[];
  /** 상세조회(detail 채우는) 요청 상태 */
  detailStatus: StatusState;
};

const initialState: BillingHistoryState = {
  searchList: [],
  searchStatus: { ...initialStatus },

  detail: [],
  detailStatus: { ...initialStatus },
};

const billingHistorySlice = createSlice({
  name: "billingHistory",
  initialState,
  reducers: {
    /** 환자 이름 검색 시작 → saga 가 이 action 을 듣고 API 호출 */
    searchBillingHistoryRequest(state, _action: PayloadAction<SearchPatient>) {
      state.searchStatus = { loading: true, error: "" };
    },
    /** 환자 이름 검색 성공 */
    searchBillingHistorySuccess(state, action: PayloadAction<SearchPatientResult[]>) {
      state.searchList = action.payload;
      state.searchStatus = { loading: false, error: "" };
    },
    /** 환자 이름 검색 실패 */
    searchBillingHistoryFailure(state, action: PayloadAction<string>) {
      state.searchList = [];
      state.searchStatus = { loading: false, error: action.payload };
    },

    /** 환자별 수납이력 상세조회 시작 (검색 리스트에서 환자 선택 시 dispatch) */
    fetchBillingHistoryDetailRequest(state, _action: PayloadAction<string>) {
      state.detail = [];
      state.detailStatus = { loading: true, error: "" };
    },
    /** 환자별 수납이력 상세조회 성공 - 여러 건이라 리스트로 받음 */
    fetchBillingHistoryDetailSuccess(state, action: PayloadAction<BillingHistoryItem[]>) {
      state.detail = action.payload;
      state.detailStatus = { loading: false, error: "" };
    },
    /** 환자별 수납이력 상세조회 실패 */
    fetchBillingHistoryDetailFailure(state, action: PayloadAction<string>) {
      state.detail = [];
      state.detailStatus = { loading: false, error: action.payload };
    },
  },
});

export const {
  searchBillingHistoryRequest,
  searchBillingHistorySuccess,
  searchBillingHistoryFailure,
  fetchBillingHistoryDetailRequest,
  fetchBillingHistoryDetailSuccess,
  fetchBillingHistoryDetailFailure,
} = billingHistorySlice.actions;

export default billingHistorySlice.reducer;

// ----- Selector (가이드 10.4: 컴포넌트에서 state.xxx.yyy 깊게 파지 않기) -----

type BillingHistoryRoot = { billingHistory: BillingHistoryState };

export const selectBillingHistorySearchList = (state: BillingHistoryRoot) =>
  state.billingHistory.searchList;
export const selectBillingHistorySearchStatus = (state: BillingHistoryRoot) =>
  state.billingHistory.searchStatus;
export const selectBillingHistoryDetail = (state: BillingHistoryRoot) =>
  state.billingHistory.detail;
export const selectBillingHistoryDetailStatus = (state: BillingHistoryRoot) =>
  state.billingHistory.detailStatus;
