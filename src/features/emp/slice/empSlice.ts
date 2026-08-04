/**
 * [직원 Redux Slice]
 *
 * 상태: emps / selectedEmp / loading / detailLoading / error
 *
 * 액션 패턴 (조회·등록·수정·상세 공통):
 * - Request  → loading=true, error=null  (saga 가 API 호출 시작)
 * - Success  → loading=false, 목록/상세 반영
 * - Failure  → loading=false, error 메시지
 *
 * UI 에서는 Request 만 dispatch 하면 됨.
 * 실제 API 호출은 empSaga 가 처리.
 */
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  Emp,
  EmpRegisterRequest,
  EmpUpdateRequest,
} from "../types/empTypes";

type EmpState = {
  emps: Emp[];
  /** 오른쪽 상세 패널에 표시할 직원 */
  selectedEmp: Emp | null;
  loading: boolean;
  detailLoading: boolean;
  error: string | null;
};

const initialState: EmpState = {
  emps: [],
  selectedEmp: null,
  loading: false,
  detailLoading: false,
  error: null,
};

const empSlice = createSlice({
  name: "emp",
  initialState,
  reducers: {
    // ----- 목록 조회 -----
    fetchEmpRequest(state) {
      state.loading = true;
      state.error = null;
    },
    fetchEmpSuccess(state, action: PayloadAction<Emp[]>) {
      state.loading = false;
      state.emps = action.payload;
    },
    fetchEmpFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // ----- 상세 조회 -----
    fetchEmpDetailRequest(state, _action: PayloadAction<number>) {
      state.detailLoading = true;
      state.error = null;
    },
    fetchEmpDetailSuccess(state, action: PayloadAction<Emp>) {
      state.detailLoading = false;
      state.selectedEmp = action.payload;
    },
    fetchEmpDetailFailure(state, action: PayloadAction<string>) {
      state.detailLoading = false;
      state.selectedEmp = null;
      state.error = action.payload;
    },
    /** 상세 패널 비우기 (선택 해제) */
    clearEmpDetail(state) {
      state.selectedEmp = null;
      state.detailLoading = false;
    },

    // ----- 등록 -----
    fetchEmpRegisterRequest(state, _action: PayloadAction<EmpRegisterRequest>) {
      state.loading = true;
      state.error = null;
    },
    fetchEmpRegisterSuccess(state, action: PayloadAction<Emp>) {
      state.loading = false;
      state.emps.push(action.payload); // 목록 끝에 추가
    },
    fetchEmpRegisterFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // ----- 수정 -----
    fetchEmpUpdateRequest(state, _action: PayloadAction<EmpUpdateRequest>) {
      state.loading = true;
      state.error = null;
    },
    fetchEmpUpdateSuccess(state, action: PayloadAction<Emp>) {
      state.loading = false;
      // 같은 empId 행만 교체
      state.emps = state.emps.map((emp) =>
        emp.empId === action.payload.empId ? action.payload : emp,
      );
      // 상세 패널이 같은 직원이면 같이 갱신
      if (state.selectedEmp?.empId === action.payload.empId) {
        state.selectedEmp = action.payload;
      }
    },
    fetchEmpUpdateFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchEmpRequest,
  fetchEmpSuccess,
  fetchEmpFailure,
  fetchEmpDetailRequest,
  fetchEmpDetailSuccess,
  fetchEmpDetailFailure,
  clearEmpDetail,
  fetchEmpRegisterRequest,
  fetchEmpRegisterSuccess,
  fetchEmpRegisterFailure,
  fetchEmpUpdateRequest,
  fetchEmpUpdateSuccess,
  fetchEmpUpdateFailure,
} = empSlice.actions;

export default empSlice.reducer;
