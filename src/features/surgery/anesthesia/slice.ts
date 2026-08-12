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
 * <p>records 는 한 수술의 마취기록 목록이다. 마취 방식을 도중에 바꾸면 기록을
 * 새로 남기므로 단건이 아니라 배열이다.</p>
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
