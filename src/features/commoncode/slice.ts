import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  CommonCodeGroup,
  CommonCodeItem,
  CreateCommonCodeGroupRequest,
  CreateCommonCodeRequest,
  UpdateCommonCodeGroupRequest,
  UpdateCommonCodeRequest,
} from "@/features/commoncode/types";

type SaveStatus = "idle" | "saving" | "success" | "failure";

/**
 * commoncode slice
 * - byGroup: Select용 항목 캐시
 * - groups / items: 관리 화면
 */
type CommonCodeState = {
  byGroup: Record<string, CommonCodeItem[]>;
  loading: boolean;
  error: string;

  groups: CommonCodeGroup[];
  groupsLoading: boolean;
  groupsError: string;
  groupSaveStatus: SaveStatus;
  groupSaveError: string;

  items: CommonCodeItem[];
  itemsLoading: boolean;
  itemsError: string;
  itemSaveStatus: SaveStatus;
  itemSaveError: string;
};

const initialState: CommonCodeState = {
  byGroup: {},
  loading: false,
  error: "",

  groups: [],
  groupsLoading: false,
  groupsError: "",
  groupSaveStatus: "idle",
  groupSaveError: "",

  items: [],
  itemsLoading: false,
  itemsError: "",
  itemSaveStatus: "idle",
  itemSaveError: "",
};

const commonCodeSlice = createSlice({
  name: "commoncode",
  initialState,
  reducers: {
    fetchCommonCodesRequest(
      state,
      _action: PayloadAction<{ groupCode: string; useYn?: string; keyword?: string }>,
    ) {
      state.loading = true;
      state.error = "";
    },
    fetchCommonCodesSuccess(
      state,
      action: PayloadAction<{ groupCode: string; items: CommonCodeItem[] }>,
    ) {
      state.byGroup[action.payload.groupCode] = action.payload.items;
      state.loading = false;
      state.error = "";
    },
    fetchCommonCodesFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    fetchCommonCodeGroupsRequest(state) {
      state.groupsLoading = true;
      state.groupsError = "";
    },
    fetchCommonCodeGroupsSuccess(state, action: PayloadAction<CommonCodeGroup[]>) {
      state.groups = action.payload;
      state.groupsLoading = false;
      state.groupsError = "";
    },
    fetchCommonCodeGroupsFailure(state, action: PayloadAction<string>) {
      state.groups = [];
      state.groupsLoading = false;
      state.groupsError = action.payload;
    },

    createCommonCodeGroupRequest(
      state,
      _action: PayloadAction<CreateCommonCodeGroupRequest>,
    ) {
      state.groupSaveStatus = "saving";
      state.groupSaveError = "";
    },
    createCommonCodeGroupSuccess(state, action: PayloadAction<CommonCodeGroup>) {
      state.groups = [action.payload, ...state.groups];
      state.groupSaveStatus = "success";
      state.groupSaveError = "";
    },
    createCommonCodeGroupFailure(state, action: PayloadAction<string>) {
      state.groupSaveStatus = "failure";
      state.groupSaveError = action.payload;
    },

    updateCommonCodeGroupRequest(
      state,
      _action: PayloadAction<{ groupId: number; payload: UpdateCommonCodeGroupRequest }>,
    ) {
      state.groupSaveStatus = "saving";
      state.groupSaveError = "";
    },
    updateCommonCodeGroupSuccess(state, action: PayloadAction<CommonCodeGroup>) {
      const updated = action.payload;
      state.groups = state.groups.map((g) =>
        g.groupId === updated.groupId ? updated : g,
      );
      state.groupSaveStatus = "success";
      state.groupSaveError = "";
    },
    updateCommonCodeGroupFailure(state, action: PayloadAction<string>) {
      state.groupSaveStatus = "failure";
      state.groupSaveError = action.payload;
    },

    deleteCommonCodeGroupRequest(state, _action: PayloadAction<number>) {
      state.groupSaveStatus = "saving";
      state.groupSaveError = "";
    },
    deleteCommonCodeGroupSuccess(state, action: PayloadAction<number>) {
      state.groups = state.groups.filter((g) => g.groupId !== action.payload);
      state.items = [];
      state.groupSaveStatus = "success";
      state.groupSaveError = "";
    },
    deleteCommonCodeGroupFailure(state, action: PayloadAction<string>) {
      state.groupSaveStatus = "failure";
      state.groupSaveError = action.payload;
    },

    clearGroupSaveStatus(state) {
      state.groupSaveStatus = "idle";
      state.groupSaveError = "";
    },

    /** 관리 화면용 항목 목록 (byGroup 와 별도) */
    fetchManageCodesRequest(
      state,
      _action: PayloadAction<{ groupCode: string; useYn?: string; keyword?: string }>,
    ) {
      state.itemsLoading = true;
      state.itemsError = "";
    },
    fetchManageCodesSuccess(state, action: PayloadAction<CommonCodeItem[]>) {
      state.items = action.payload;
      state.itemsLoading = false;
      state.itemsError = "";
    },
    fetchManageCodesFailure(state, action: PayloadAction<string>) {
      state.items = [];
      state.itemsLoading = false;
      state.itemsError = action.payload;
    },

    createCommonCodeRequest(state, _action: PayloadAction<CreateCommonCodeRequest>) {
      state.itemSaveStatus = "saving";
      state.itemSaveError = "";
    },
    createCommonCodeSuccess(state, action: PayloadAction<CommonCodeItem>) {
      state.items = [action.payload, ...state.items];
      state.itemSaveStatus = "success";
      state.itemSaveError = "";
    },
    createCommonCodeFailure(state, action: PayloadAction<string>) {
      state.itemSaveStatus = "failure";
      state.itemSaveError = action.payload;
    },

    updateCommonCodeRequest(
      state,
      _action: PayloadAction<{ codeId: number; payload: UpdateCommonCodeRequest }>,
    ) {
      state.itemSaveStatus = "saving";
      state.itemSaveError = "";
    },
    updateCommonCodeSuccess(state, action: PayloadAction<CommonCodeItem>) {
      const updated = action.payload;
      state.items = state.items.map((c) =>
        c.codeId === updated.codeId ? updated : c,
      );
      state.itemSaveStatus = "success";
      state.itemSaveError = "";
    },
    updateCommonCodeFailure(state, action: PayloadAction<string>) {
      state.itemSaveStatus = "failure";
      state.itemSaveError = action.payload;
    },

    deleteCommonCodeRequest(state, _action: PayloadAction<number>) {
      state.itemSaveStatus = "saving";
      state.itemSaveError = "";
    },
    deleteCommonCodeSuccess(state, action: PayloadAction<number>) {
      state.items = state.items.filter((c) => c.codeId !== action.payload);
      state.itemSaveStatus = "success";
      state.itemSaveError = "";
    },
    deleteCommonCodeFailure(state, action: PayloadAction<string>) {
      state.itemSaveStatus = "failure";
      state.itemSaveError = action.payload;
    },

    clearItemSaveStatus(state) {
      state.itemSaveStatus = "idle";
      state.itemSaveError = "";
    },

    clearManageCodes(state) {
      state.items = [];
      state.itemsError = "";
    },
  },
});

export const {
  fetchCommonCodesRequest,
  fetchCommonCodesSuccess,
  fetchCommonCodesFailure,
  fetchCommonCodeGroupsRequest,
  fetchCommonCodeGroupsSuccess,
  fetchCommonCodeGroupsFailure,
  createCommonCodeGroupRequest,
  createCommonCodeGroupSuccess,
  createCommonCodeGroupFailure,
  updateCommonCodeGroupRequest,
  updateCommonCodeGroupSuccess,
  updateCommonCodeGroupFailure,
  deleteCommonCodeGroupRequest,
  deleteCommonCodeGroupSuccess,
  deleteCommonCodeGroupFailure,
  clearGroupSaveStatus,
  fetchManageCodesRequest,
  fetchManageCodesSuccess,
  fetchManageCodesFailure,
  createCommonCodeRequest,
  createCommonCodeSuccess,
  createCommonCodeFailure,
  updateCommonCodeRequest,
  updateCommonCodeSuccess,
  updateCommonCodeFailure,
  deleteCommonCodeRequest,
  deleteCommonCodeSuccess,
  deleteCommonCodeFailure,
  clearItemSaveStatus,
  clearManageCodes,
} = commonCodeSlice.actions;

export default commonCodeSlice.reducer;

type CommonCodeRoot = { commoncode: CommonCodeState };

export const selectCommonCodesByGroup =
  (groupCode: string) => (state: CommonCodeRoot) =>
    state.commoncode.byGroup[groupCode] ?? [];

export const selectCommonCodeLoading = (state: CommonCodeRoot) =>
  state.commoncode.loading;

export const selectCommonCodeError = (state: CommonCodeRoot) =>
  state.commoncode.error;

export const selectCommonCodeLabel =
  (groupCode: string, codeValue: string | null | undefined) =>
  (state: CommonCodeRoot) => {
    if (!codeValue) return "-";
    const items = state.commoncode.byGroup[groupCode] ?? [];
    return items.find((i) => i.codeValue === codeValue)?.codeName ?? codeValue;
  };

export const selectCommonCodeGroups = (state: CommonCodeRoot) =>
  state.commoncode.groups;

export const selectCommonCodeGroupsLoading = (state: CommonCodeRoot) =>
  state.commoncode.groupsLoading;

export const selectCommonCodeGroupsError = (state: CommonCodeRoot) =>
  state.commoncode.groupsError;

export const selectGroupSaveStatus = (state: CommonCodeRoot) =>
  state.commoncode.groupSaveStatus;

export const selectGroupSaveError = (state: CommonCodeRoot) =>
  state.commoncode.groupSaveError;

export const selectManageCodes = (state: CommonCodeRoot) => state.commoncode.items;

export const selectManageCodesLoading = (state: CommonCodeRoot) =>
  state.commoncode.itemsLoading;

export const selectManageCodesError = (state: CommonCodeRoot) =>
  state.commoncode.itemsError;

export const selectItemSaveStatus = (state: CommonCodeRoot) =>
  state.commoncode.itemSaveStatus;

export const selectItemSaveError = (state: CommonCodeRoot) =>
  state.commoncode.itemSaveError;
