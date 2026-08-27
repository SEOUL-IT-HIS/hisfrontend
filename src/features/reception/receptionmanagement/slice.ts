import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/store/store";
import type {
  ReceptionListItem,
  ReceptionDetail,
  ReceptionListQuery,
  ReceptionRegisterRequest,
  ReceptionCancelRequest,
  DepartmentOption,
  DoctorOption,
} from "./types";

type ReceptionManagementState = {
  list: ReceptionListItem[];
  listLoading: boolean;
  listError: string | null;

  detail: ReceptionDetail | null;
  detailLoading: boolean;
  detailError: string | null;

  departments: DepartmentOption[];
  departmentsLoading: boolean;
  departmentsError: string | null;

  doctors: DoctorOption[];
  doctorsLoading: boolean;
  doctorsError: string | null;

  registerLoading: boolean;
  registerError: string | null;
  /** 등록 성공 시마다 증가 — 등록 폼을 key 로 리마운트해 초기화하는 데 사용 */
  registerSuccessCount: number;

  cancelLoading: boolean;
  cancelError: string | null;
};

const initialState: ReceptionManagementState = {
  list: [],
  listLoading: false,
  listError: null,

  detail: null,
  detailLoading: false,
  detailError: null,

  departments: [],
  departmentsLoading: false,
  departmentsError: null,

  doctors: [],
  doctorsLoading: false,
  doctorsError: null,

  registerLoading: false,
  registerError: null,
  registerSuccessCount: 0,

  cancelLoading: false,
  cancelError: null,
};

const receptionManagementSlice = createSlice({
  name: "reception/receptionmanagement",
  initialState,
  reducers: {
    fetchReceptionListRequest: {
      reducer(state) {
        state.listLoading = true;
        state.listError = null;
      },
      prepare(query?: ReceptionListQuery) {
        return { payload: query ?? {} };
      },
    },
    fetchReceptionListSuccess(
      state,
      action: PayloadAction<ReceptionListItem[]>,
    ) {
      state.listLoading = false;
      state.list = action.payload;
    },
    fetchReceptionListFailure(state, action: PayloadAction<string>) {
      state.listLoading = false;
      state.listError = action.payload;
    },

    fetchReceptionDetailRequest(state, _action: PayloadAction<string>) {
      state.detailLoading = true;
      state.detailError = null;
    },
    fetchReceptionDetailSuccess(
      state,
      action: PayloadAction<ReceptionDetail>,
    ) {
      state.detailLoading = false;
      state.detail = action.payload;
    },
    fetchReceptionDetailFailure(state, action: PayloadAction<string>) {
      state.detailLoading = false;
      state.detailError = action.payload;
    },
    clearReceptionDetail(state) {
      state.detail = null;
      state.detailError = null;
    },

    fetchDepartmentsRequest(state) {
      state.departmentsLoading = true;
      state.departmentsError = null;
    },
    fetchDepartmentsSuccess(state, action: PayloadAction<DepartmentOption[]>) {
      state.departmentsLoading = false;
      state.departments = action.payload;
    },
    fetchDepartmentsFailure(state, action: PayloadAction<string>) {
      state.departmentsLoading = false;
      state.departmentsError = action.payload;
    },

    fetchDoctorsRequest(state, _action: PayloadAction<string>) {
      state.doctorsLoading = true;
      state.doctorsError = null;
      state.doctors = [];
    },
    fetchDoctorsSuccess(state, action: PayloadAction<DoctorOption[]>) {
      state.doctorsLoading = false;
      state.doctors = action.payload;
    },
    fetchDoctorsFailure(state, action: PayloadAction<string>) {
      state.doctorsLoading = false;
      state.doctorsError = action.payload;
    },
    clearDoctors(state) {
      state.doctors = [];
    },

    registerReceptionRequest: {
      reducer(state) {
        state.registerLoading = true;
        state.registerError = null;
      },
      prepare(request: ReceptionRegisterRequest) {
        return { payload: request };
      },
    },
    registerReceptionSuccess(state) {
      state.registerLoading = false;
      state.registerSuccessCount += 1;
    },
    registerReceptionFailure(state, action: PayloadAction<string>) {
      state.registerLoading = false;
      state.registerError = action.payload;
    },

    cancelReceptionRequest: {
      reducer(state) {
        state.cancelLoading = true;
        state.cancelError = null;
      },
      prepare(request: ReceptionCancelRequest) {
        return { payload: request };
      },
    },
    cancelReceptionSuccess(state) {
      state.cancelLoading = false;
    },
    cancelReceptionFailure(state, action: PayloadAction<string>) {
      state.cancelLoading = false;
      state.cancelError = action.payload;
    },
  },
});

export const {
  fetchReceptionListRequest,
  fetchReceptionListSuccess,
  fetchReceptionListFailure,
  fetchReceptionDetailRequest,
  fetchReceptionDetailSuccess,
  fetchReceptionDetailFailure,
  clearReceptionDetail,
  fetchDepartmentsRequest,
  fetchDepartmentsSuccess,
  fetchDepartmentsFailure,
  fetchDoctorsRequest,
  fetchDoctorsSuccess,
  fetchDoctorsFailure,
  clearDoctors,
  registerReceptionRequest,
  registerReceptionSuccess,
  registerReceptionFailure,
  cancelReceptionRequest,
  cancelReceptionSuccess,
  cancelReceptionFailure,
} = receptionManagementSlice.actions;

export const selectReceptionList = (state: RootState) =>
  state.reception.receptionmanagement.list;
export const selectReceptionListLoading = (state: RootState) =>
  state.reception.receptionmanagement.listLoading;
export const selectReceptionListError = (state: RootState) =>
  state.reception.receptionmanagement.listError;
export const selectReceptionDetail = (state: RootState) =>
  state.reception.receptionmanagement.detail;
export const selectReceptionDetailLoading = (state: RootState) =>
  state.reception.receptionmanagement.detailLoading;
export const selectReceptionDetailError = (state: RootState) =>
  state.reception.receptionmanagement.detailError;
export const selectDepartments = (state: RootState) =>
  state.reception.receptionmanagement.departments;
export const selectDoctors = (state: RootState) =>
  state.reception.receptionmanagement.doctors;
export const selectDoctorsLoading = (state: RootState) =>
  state.reception.receptionmanagement.doctorsLoading;
export const selectRegisterLoading = (state: RootState) =>
  state.reception.receptionmanagement.registerLoading;
export const selectRegisterError = (state: RootState) =>
  state.reception.receptionmanagement.registerError;
export const selectRegisterSuccessCount = (state: RootState) =>
  state.reception.receptionmanagement.registerSuccessCount;
export const selectCancelLoading = (state: RootState) =>
  state.reception.receptionmanagement.cancelLoading;
export const selectCancelError = (state: RootState) =>
  state.reception.receptionmanagement.cancelError;

export default receptionManagementSlice.reducer;
