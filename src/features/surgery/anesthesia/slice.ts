import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  AnesthesiaRecord,
  AnesthesiaState,
  AppendVitalSignsRequest,
  CreateAnesthesiaRecordRequest,
} from "@/features/surgery/anesthesia/types";

/**
 * 마취기록 slice (SL2-3)
 *
 * <p>상태만 관리하고 API 호출은 saga 가 담당한다(§10.3).</p>
 */
const initialState: AnesthesiaState = {
  records: [],
  selectedRecord: null,
  loading: false,
  saving: false,
  error: "",
};

const anesthesiaSlice = createSlice({
  name: "surgery/anesthesia",
  initialState,
  reducers: {
    // ----- 조회 (SL2-34) -----
    fetchAnesthesiaRecordsRequest: {
      reducer(state) {
        state.loading = true;
        state.error = "";
      },
      prepare(surgeryId: string) {
        return { payload: surgeryId };
      },
    },
    fetchAnesthesiaRecordsSuccess(
      state,
      action: PayloadAction<AnesthesiaRecord[]>,
    ) {
      state.loading = false;
      state.records = action.payload;
    },
    fetchAnesthesiaRecordsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    fetchAnesthesiaRecordRequest: {
      reducer(state) {
        state.loading = true;
        state.error = "";
      },
      prepare(anesthesiaId: string) {
        return { payload: anesthesiaId };
      },
    },
    fetchAnesthesiaRecordSuccess(
      state,
      action: PayloadAction<AnesthesiaRecord>,
    ) {
      state.loading = false;
      state.selectedRecord = action.payload;
    },
    fetchAnesthesiaRecordFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // ----- 생성 (SL2-21) -----
    createAnesthesiaRecordRequest: {
      reducer(state) {
        state.saving = true;
        state.error = "";
      },
      prepare(surgeryId: string, request: CreateAnesthesiaRecordRequest) {
        return { payload: { surgeryId, request } };
      },
    },

    /**
     * 활력징후 추가 (SL2-18)
     *
     * <p>덮어쓰기가 아니라 누적이다. 성공 시 saga 가 목록을 다시 불러온다.</p>
     */
    appendVitalSignsRequest: {
      reducer(state) {
        state.saving = true;
        state.error = "";
      },
      prepare(
        anesthesiaId: string,
        surgeryId: string,
        request: AppendVitalSignsRequest,
      ) {
        // surgeryId 는 성공 후 목록 재조회에 쓴다
        return { payload: { anesthesiaId, surgeryId, request } };
      },
    },

    anesthesiaMutationSuccess(state) {
      state.saving = false;
      state.error = "";
    },
    anesthesiaMutationFailure(state, action: PayloadAction<string>) {
      state.saving = false;
      state.error = action.payload;
    },

    resetAnesthesiaState() {
      return initialState;
    },
  },
});

export const {
  fetchAnesthesiaRecordsRequest,
  fetchAnesthesiaRecordsSuccess,
  fetchAnesthesiaRecordsFailure,
  fetchAnesthesiaRecordRequest,
  fetchAnesthesiaRecordSuccess,
  fetchAnesthesiaRecordFailure,
  createAnesthesiaRecordRequest,
  appendVitalSignsRequest,
  anesthesiaMutationSuccess,
  anesthesiaMutationFailure,
  resetAnesthesiaState,
} = anesthesiaSlice.actions;

export default anesthesiaSlice.reducer;

// ----- Selector (§10.4) -----
type AnesthesiaRoot = { surgery: { anesthesia: AnesthesiaState } };

export const selectAnesthesiaRecords = (state: AnesthesiaRoot) =>
  state.surgery.anesthesia.records;
export const selectSelectedAnesthesiaRecord = (state: AnesthesiaRoot) =>
  state.surgery.anesthesia.selectedRecord;
export const selectAnesthesiaLoading = (state: AnesthesiaRoot) =>
  state.surgery.anesthesia.loading;
export const selectAnesthesiaSaving = (state: AnesthesiaRoot) =>
  state.surgery.anesthesia.saving;
export const selectAnesthesiaError = (state: AnesthesiaRoot) =>
  state.surgery.anesthesia.error;
