import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  CreateEmployeeRequest,
  Employee,
  UpdateEmployeeRequest,
} from "@/features/admin/types";

/**
 * admin slice
 * - 직원 목록 / 등록 / 수정 상태만 관리
 * - API 호출은 여기서 하지 않는다 → saga 가 담당
 *
 * Action 이름 규칙 (가이드 10.2)
 * - Request / Success / Failure
 * - prefix: admin/...  (createSlice name = "admin")
 */
type SaveStatus = "idle" | "saving" | "success" | "failure";

type AdminState = {
  employees: Employee[];
  loading: boolean;
  error: string;
  saveStatus: SaveStatus;
  saveError: string;
};

const initialState: AdminState = {
  employees: [],
  loading: false,
  error: "",
  saveStatus: "idle",
  saveError: "",
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    /** 직원 목록 조회 시작 → saga 가 이 action 을 듣고 API 호출 */
    fetchEmployeesRequest(state) {
      state.loading = true;
      state.error = "";
    },
    /** 직원 목록 조회 성공 */
    fetchEmployeesSuccess(state, action: PayloadAction<Employee[]>) {
      state.employees = action.payload;
      state.loading = false;
      state.error = "";
    },
    /** 직원 목록 조회 실패 */
    fetchEmployeesFailure(state, action: PayloadAction<string>) {
      state.employees = [];
      state.loading = false;
      state.error = action.payload;
    },

    /** 직원 등록 시작 */
    createEmployeeRequest(state, _action: PayloadAction<CreateEmployeeRequest>) {
      state.saveStatus = "saving";
      state.saveError = "";
    },
    /** 직원 등록 성공 */
    createEmployeeSuccess(state, action: PayloadAction<Employee>) {
      state.employees = [action.payload, ...state.employees];
      state.saveStatus = "success";
      state.saveError = "";
    },
    /** 직원 등록 실패 */
    createEmployeeFailure(state, action: PayloadAction<string>) {
      state.saveStatus = "failure";
      state.saveError = action.payload;
    },

    /** 직원 수정 시작 */
    updateEmployeeRequest(
      state,
      _action: PayloadAction<{ empId: number; payload: UpdateEmployeeRequest }>,
    ) {
      state.saveStatus = "saving";
      state.saveError = "";
    },
    /** 직원 수정 성공 */
    updateEmployeeSuccess(state, action: PayloadAction<Employee>) {
      const updated = action.payload;
      state.employees = state.employees.map((emp) =>
        emp.empId === updated.empId ? updated : emp,
      );
      state.saveStatus = "success";
      state.saveError = "";
    },
    /** 직원 수정 실패 */
    updateEmployeeFailure(state, action: PayloadAction<string>) {
      state.saveStatus = "failure";
      state.saveError = action.payload;
    },

    /** 등록/수정 UI 상태 초기화 (모달 닫을 때 등) */
    clearSaveStatus(state) {
      state.saveStatus = "idle";
      state.saveError = "";
    },
  },
});

export const {
  fetchEmployeesRequest,
  fetchEmployeesSuccess,
  fetchEmployeesFailure,
  createEmployeeRequest,
  createEmployeeSuccess,
  createEmployeeFailure,
  updateEmployeeRequest,
  updateEmployeeSuccess,
  updateEmployeeFailure,
  clearSaveStatus,
} = adminSlice.actions;

export default adminSlice.reducer;

// ----- Selector (가이드 10.4: 컴포넌트에서 state.xxx.yyy 깊게 파지 않기) -----

type AdminRoot = { admin: AdminState };

export const selectEmployees = (state: AdminRoot) => state.admin.employees;
export const selectEmployeesLoading = (state: AdminRoot) => state.admin.loading;
export const selectEmployeesError = (state: AdminRoot) => state.admin.error;
export const selectEmployeeSaveStatus = (state: AdminRoot) => state.admin.saveStatus;
export const selectEmployeeSaveError = (state: AdminRoot) => state.admin.saveError;
export const selectEmployeeSaving = (state: AdminRoot) =>
  state.admin.saveStatus === "saving";
