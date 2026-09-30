import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  InterfaceSendLog,
  InterfaceSendLogSearch,
  InterfaceSendLogState,
  PageResponse,
} from "@/features/labimaging/interfacelog/types";

/**
 * 연계 발신 이력 slice — ZP2-120 결과전송 이력 / ZP2-124 청구 발행 이력 (5차 Phase 6)
 *
 * ⚠ 마지막 조회 조건(search)을 state 에 둔다. 재전송 뒤 같은 조건·같은 페이지로 목록을 다시 불러오기 위해서다.
 * ⚠ root 가 아니라 labimaging 공통 slice(features/labimaging/common/slice.ts)에 붙인다(수정 권한 규칙).
 */
const initialState: InterfaceSendLogState = {
  search: { eventTypeCode: "", sendStatusCode: "", from: "", to: "", page: 0, size: 20 },
  list: null,
  loading: false,
  loadError: "",
  detail: null,
  detailLoading: false,
  detailError: "",
  resending: false,
  resendError: "",
  lastResentId: null,
};

const interfaceSendLogSlice = createSlice({
  name: "labImaging/interfacelog",
  initialState,
  reducers: {
    // ---------- 목록 ----------
    fetchInterfaceSendLogsRequest(state, action: PayloadAction<InterfaceSendLogSearch>) {
      state.search = action.payload;
      state.loading = true;
      state.loadError = "";
    },
    fetchInterfaceSendLogsSuccess(state, action: PayloadAction<PageResponse<InterfaceSendLog>>) {
      state.loading = false;
      state.list = action.payload;
    },
    fetchInterfaceSendLogsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.loadError = action.payload;
    },

    // ---------- 상세 ----------
    fetchInterfaceSendLogDetailRequest: {
      reducer(state) {
        state.detailLoading = true;
        state.detailError = "";
      },
      prepare(interfaceSendLogId: string) {
        return { payload: interfaceSendLogId };
      },
    },
    fetchInterfaceSendLogDetailSuccess(state, action: PayloadAction<InterfaceSendLog>) {
      state.detailLoading = false;
      state.detail = action.payload;
    },
    fetchInterfaceSendLogDetailFailure(state, action: PayloadAction<string>) {
      state.detailLoading = false;
      state.detailError = action.payload;
    },
    clearInterfaceSendLogDetail(state) {
      state.detail = null;
      state.detailError = "";
      state.resendError = "";
    },

    // ---------- 재전송 ----------
    resendInterfaceSendLogRequest: {
      reducer(state) {
        state.resending = true;
        state.resendError = "";
        state.lastResentId = null;
      },
      prepare(interfaceSendLogId: string) {
        return { payload: interfaceSendLogId };
      },
    },
    resendInterfaceSendLogSuccess(state, action: PayloadAction<InterfaceSendLog>) {
      state.resending = false;
      state.lastResentId = action.payload.interfaceSendLogId;
    },
    resendInterfaceSendLogFailure(state, action: PayloadAction<string>) {
      state.resending = false;
      state.resendError = action.payload;
    },
  },
});

export const {
  fetchInterfaceSendLogsRequest,
  fetchInterfaceSendLogsSuccess,
  fetchInterfaceSendLogsFailure,
  fetchInterfaceSendLogDetailRequest,
  fetchInterfaceSendLogDetailSuccess,
  fetchInterfaceSendLogDetailFailure,
  clearInterfaceSendLogDetail,
  resendInterfaceSendLogRequest,
  resendInterfaceSendLogSuccess,
  resendInterfaceSendLogFailure,
} = interfaceSendLogSlice.actions;

export default interfaceSendLogSlice.reducer;

// ----- Selector (가이드 10.4) -----
type Root = { labImaging: { interfacelog: InterfaceSendLogState } };

export const selectInterfaceSendLogSearch = (s: Root) => s.labImaging.interfacelog.search;
export const selectInterfaceSendLogList = (s: Root) => s.labImaging.interfacelog.list;
export const selectInterfaceSendLogLoading = (s: Root) => s.labImaging.interfacelog.loading;
export const selectInterfaceSendLogLoadError = (s: Root) => s.labImaging.interfacelog.loadError;
export const selectInterfaceSendLogDetail = (s: Root) => s.labImaging.interfacelog.detail;
export const selectInterfaceSendLogDetailLoading = (s: Root) => s.labImaging.interfacelog.detailLoading;
export const selectInterfaceSendLogDetailError = (s: Root) => s.labImaging.interfacelog.detailError;
export const selectInterfaceSendLogResending = (s: Root) => s.labImaging.interfacelog.resending;
export const selectInterfaceSendLogResendError = (s: Root) => s.labImaging.interfacelog.resendError;
export const selectLastResentInterfaceSendLogId = (s: Root) => s.labImaging.interfacelog.lastResentId;
