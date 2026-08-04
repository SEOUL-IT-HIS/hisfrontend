import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  CreateOperativeRecordRequest,
  OperativeRecord,
  OperativeRecordState,
  UpdateOperativeRecordRequest,
} from "@/features/surgery/operativeRecord/types";

/**
 * 수술기록지 slice (SL2-51)
 *
 * <p>상태만 관리하고 API 호출은 saga 가 담당한다(§10.3).</p>
 */
const initialState: OperativeRecordState = {
  records: [],
  selectedRecord: null,
  loading: false,
  saving: false,
  error: "",
};

const operativeRecordSlice = createSlice({
  name: "surgery/operativeRecord",
  initialState,
  reducers: {
    // ----- 조회 (SL2-57) -----
    fetchOperativeRecordsRequest: {
      reducer(state) {
        state.loading = true;
        state.error = "";
      },
      prepare(surgeryId: string) {
        return { payload: surgeryId };
      },
    },
    fetchOperativeRecordsSuccess(
      state,
      action: PayloadAction<OperativeRecord[]>,
    ) {
      state.loading = false;
      state.records = action.payload;
    },
    fetchOperativeRecordsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    fetchOperativeRecordRequest: {
      reducer(state) {
        state.loading = true;
        state.error = "";
      },
      prepare(recordId: string) {
        return { payload: recordId };
      },
    },
    fetchOperativeRecordSuccess(state, action: PayloadAction<OperativeRecord>) {
      state.loading = false;
      state.selectedRecord = action.payload;
    },
    fetchOperativeRecordFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // ----- 작성/수정 (SL2-55 / SL2-56) -----
    createOperativeRecordRequest: {
      reducer(state) {
        state.saving = true;
        state.error = "";
      },
      prepare(surgeryId: string, request: CreateOperativeRecordRequest) {
        return { payload: { surgeryId, request } };
      },
    },
    /** 확정(02) 상태 기록은 백엔드가 SUR043 으로 거부한다 */
    updateOperativeRecordRequest: {
      reducer(state) {
        state.saving = true;
        state.error = "";
      },
      prepare(
        recordId: string,
        surgeryId: string,
        request: UpdateOperativeRecordRequest,
      ) {
        // surgeryId 는 성공 후 목록 재조회에 쓴다
        return { payload: { recordId, surgeryId, request } };
      },
    },

    operativeRecordMutationSuccess(state) {
      state.saving = false;
      state.error = "";
    },
    operativeRecordMutationFailure(state, action: PayloadAction<string>) {
      state.saving = false;
      state.error = action.payload;
    },

    resetOperativeRecordState() {
      return initialState;
    },
  },
});

export const {
  fetchOperativeRecordsRequest,
  fetchOperativeRecordsSuccess,
  fetchOperativeRecordsFailure,
  fetchOperativeRecordRequest,
  fetchOperativeRecordSuccess,
  fetchOperativeRecordFailure,
  createOperativeRecordRequest,
  updateOperativeRecordRequest,
  operativeRecordMutationSuccess,
  operativeRecordMutationFailure,
  resetOperativeRecordState,
} = operativeRecordSlice.actions;

export default operativeRecordSlice.reducer;

// ----- Selector (§10.4) -----
type OperativeRecordRoot = {
  surgery: { operativeRecord: OperativeRecordState };
};

export const selectOperativeRecords = (state: OperativeRecordRoot) =>
  state.surgery.operativeRecord.records;
export const selectSelectedOperativeRecord = (state: OperativeRecordRoot) =>
  state.surgery.operativeRecord.selectedRecord;
export const selectOperativeRecordLoading = (state: OperativeRecordRoot) =>
  state.surgery.operativeRecord.loading;
export const selectOperativeRecordSaving = (state: OperativeRecordRoot) =>
  state.surgery.operativeRecord.saving;
export const selectOperativeRecordError = (state: OperativeRecordRoot) =>
  state.surgery.operativeRecord.error;
