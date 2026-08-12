import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  ChecklistState,
  CreateChecklistRequest,
  SurgeryChecklist,
  UpdateChecklistRequest,
} from "@/features/surgery/checklist/types";

/**
 * 수술 안전 체크리스트 slice (SL2-35 조회 / SL2-46·47·48 작성 / SL2-49 수정)
 *
 * <p>상태만 관리하고 API 호출은 saga 가 담당한다(§10.3).
 * createSlice name = "surgery/checklist" (§10.2 서비스 prefix 유지)</p>
 *
 * <p>동의서 slice 와 같은 3액션 한 벌 구조다 — Request 로 시작해 Success/Failure 로 끝난다.
 * 컴포넌트는 Request 만 dispatch 하고, 나머지는 saga 가 흘려보낸다.</p>
 *
 * <p><b>등록과 수정이 Mutation 액션을 같이 쓰는 이유</b> — 둘 다 끝나면 목록을 다시 읽는다.
 * 화면에서 구분할 일이 없어 성공/실패 액션을 나눌 실익이 없다. 동의서 slice 도 같은 방식이다.</p>
 *
 * <p><b>items 를 단계별로 쪼개지 않은 이유</b> — 백엔드가 한 수술의 전 단계를 한 배열로
 * 돌려준다. 화면에서 phaseCd 로 걸러 쓰는 편이, 세 개의 상태를 따로 관리하다 서로
 * 어긋나는 것보다 안전하다.</p>
 */
const initialState: ChecklistState = {
  items: [],
  loading: false,
  saving: false,
  error: "",
};

const checklistSlice = createSlice({
  name: "surgery/checklist",
  initialState,
  reducers: {
    // ----- 조회 (SL2-35) -----
    fetchChecklistRequest: {
      reducer(state) {
        state.loading = true;
        state.error = "";
      },
      prepare(surgeryId: string) {
        return { payload: surgeryId };
      },
    },
    fetchChecklistSuccess(state, action: PayloadAction<SurgeryChecklist[]>) {
      state.loading = false;
      state.items = action.payload;
    },
    fetchChecklistFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // ----- 등록 (SL2-46·47·48) -----
    createChecklistRequest: {
      reducer(state) {
        state.saving = true;
        state.error = "";
      },
      prepare(surgeryId: string, request: CreateChecklistRequest) {
        return { payload: { surgeryId, request } };
      },
    },

    // ----- 수정 (SL2-49) -----
    // surgeryId 를 함께 싣는 이유 — 수정 API 는 checklistId 만 받지만,
    // 끝난 뒤 목록을 다시 읽으려면 어느 수술인지 알아야 한다.
    updateChecklistRequest: {
      reducer(state) {
        state.saving = true;
        state.error = "";
      },
      prepare(
        surgeryId: string,
        checklistId: string,
        request: UpdateChecklistRequest,
      ) {
        return { payload: { surgeryId, checklistId, request } };
      },
    },

    checklistMutationSuccess(state) {
      state.saving = false;
      state.error = "";
    },
    checklistMutationFailure(state, action: PayloadAction<string>) {
      state.saving = false;
      state.error = action.payload;
    },

    resetChecklistState() {
      return initialState;
    },
  },
});

export const {
  fetchChecklistRequest,
  fetchChecklistSuccess,
  fetchChecklistFailure,
  createChecklistRequest,
  updateChecklistRequest,
  checklistMutationSuccess,
  checklistMutationFailure,
  resetChecklistState,
} = checklistSlice.actions;

export default checklistSlice.reducer;

// ----- Selector (§10.4) -----
// 등록 전제: features/surgery/slice.ts 의 combineReducers 에 checklist 키
type ChecklistRoot = { surgery: { checklist: ChecklistState } };

export const selectChecklistItems = (state: ChecklistRoot) =>
  state.surgery.checklist.items;
export const selectChecklistLoading = (state: ChecklistRoot) =>
  state.surgery.checklist.loading;
export const selectChecklistSaving = (state: ChecklistRoot) =>
  state.surgery.checklist.saving;
export const selectChecklistError = (state: ChecklistRoot) =>
  state.surgery.checklist.error;
