import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  LabOrderCreateRequest,
  LabOrderCreateResponse,
  LabSpecimenState,
} from "@/features/labimaging/labspecimen/types";

/**
 * labSpecimen(검사 오더 접수) slice
 * - 상태만 관리하고 API 호출은 하지 않는다 → saga 가 담당 (가이드 10.3)
 *
 * Action prefix 는 "labImaging/" 를 유지한다. (가이드 10.2 / 요청서 3.1)
 * createSlice name = "labImaging/labspecimen" →
 *   action type 예: "labImaging/labspecimen/createLabOrderRequest"
 */
const initialState: LabSpecimenState = {
  creating: false,
  createError: "",
  lastCreated: null,
};

const labSpecimenSlice = createSlice({
  name: "labImaging/labspecimen",
  initialState,
  reducers: {
    /**
     * 접수 생성 시작 → saga 가 이 action 을 듣고 API 호출.
     * payload(요청값)는 리듀서가 아니라 saga 가 소비하므로, prepare 로 타입만 실어 보낸다.
     */
    createLabOrderRequest: {
      reducer(state) {
        state.creating = true;
        state.createError = "";
      },
      prepare(request: LabOrderCreateRequest) {
        return { payload: request };
      },
    },
    /** 접수 생성 성공 */
    createLabOrderSuccess(state, action: PayloadAction<LabOrderCreateResponse>) {
      state.creating = false;
      state.createError = "";
      state.lastCreated = action.payload;
    },
    /** 접수 생성 실패 (payload: LAB### 코드 또는 문구) */
    createLabOrderFailure(state, action: PayloadAction<string>) {
      state.creating = false;
      state.createError = action.payload;
    },
    /** 화면 이탈/재작성 시 결과 상태 초기화 */
    resetLabOrderResult(state) {
      state.createError = "";
      state.lastCreated = null;
    },
  },
});

export const {
  createLabOrderRequest,
  createLabOrderSuccess,
  createLabOrderFailure,
  resetLabOrderResult,
} = labSpecimenSlice.actions;

export default labSpecimenSlice.reducer;

// ----- Selector (가이드 10.4: 컴포넌트에서 state.xxx.yyy 깊게 접근 금지) -----
// 등록 전제: rootReducer 에 labImaging: combineReducers({ labspecimen, imagingacquisition })
// (리더 등록 요청 목록 참고)
type LabSpecimenRoot = { labImaging: { labspecimen: LabSpecimenState } };

export const selectLabOrderCreating = (state: LabSpecimenRoot) =>
  state.labImaging.labspecimen.creating;
export const selectLabOrderCreateError = (state: LabSpecimenRoot) =>
  state.labImaging.labspecimen.createError;
export const selectLastCreatedLabOrder = (state: LabSpecimenRoot) =>
  state.labImaging.labspecimen.lastCreated;
