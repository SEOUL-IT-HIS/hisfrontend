import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CommonCodeGroup } from "../types/commonCodeGroupTypes";

type CommonCodeState = {
  groups: CommonCodeGroup[];
  loading: boolean;
  error: string | null;
};

const initialState: CommonCodeState = {
  groups: [],
  loading: false,
  error: null,
};

const commonCodeGroupSlice = createSlice({
  name: "commonCodeGroup",
  initialState,
  reducers: {

    // 코드그룹목록
    fetchCommonCodeGroupRequest(state) {
      state.loading = true;
      state.error = null;
    },
    fetchCommonCodeGroupSuccess(state, action: PayloadAction<CommonCodeGroup[]>) {
      state.loading = false;
      state.groups = action.payload;
    },
    fetchCommonCodeGroupFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    // 코드그룹 등록
    fetchCommonCodeGroupRegisterRequest(
        state,
        action: PayloadAction<Pick<CommonCodeGroup, "groupCode" | "groupName" | "useYn">>,
    ) {
      state.loading = true;
      state.error = null;
    },
    fetchCommonCodeGroupRegisterSuccess(state, action: PayloadAction<CommonCodeGroup>) {
      state.loading = false;
      state.groups.push(action.payload);
    },
    fetchCommonCodeGroupRegisterFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchCommonCodeGroupRequest,
  fetchCommonCodeGroupSuccess,
  fetchCommonCodeGroupFailure,
  fetchCommonCodeGroupRegisterRequest,
  fetchCommonCodeGroupRegisterSuccess,
  fetchCommonCodeGroupRegisterFailure,
} = commonCodeGroupSlice.actions;

export default commonCodeGroupSlice.reducer;
