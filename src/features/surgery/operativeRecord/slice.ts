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
 * <p>수술기록은 마취·간호기록과 달리 수정이 열려 있다. 집도의가 초안(01)으로 남기고
 * 나중에 다듬어 확정하는 흐름이라 saving 이 등록·수정 양쪽에 쓰인다.</p>
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
