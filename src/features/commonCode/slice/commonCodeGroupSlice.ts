/**
 * [공통코드 그룹 Redux Slice]
 *
 * 상태: groups / loading / error
 *
 * 액션 패턴 (조회·등록·수정 공통):
 * - Request  → loading=true, error=null  (saga 가 API 호출 시작)
 * - Success  → loading=false, 목록 반영
 * - Failure  → loading=false, error 메시지
 *
 * UI 에서는 Request 만 dispatch 하면 됨.
 * 실제 API 호출은 commonCodeGroupSaga 가 처리.
 */
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  CommonCodeGroup,
  CommonCodeGroupUpdateRequest,
} from "../types/commonCodeGroupTypes";

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
    // ----- 목록 조회 -----
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

    // ----- 등록 -----
    fetchCommonCodeGroupRegisterRequest(
      state,
      _action: PayloadAction<Pick<CommonCodeGroup, "groupCode" | "groupName" | "useYn">>,
    ) {
      state.loading = true;
      state.error = null;
    },
    fetchCommonCodeGroupRegisterSuccess(state, action: PayloadAction<CommonCodeGroup>) {
      state.loading = false;
      state.groups.push(action.payload); // 목록 끝에 추가
    },
    fetchCommonCodeGroupRegisterFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // ----- 수정 -----
    fetchCommonCodeGroupUpdateRequest(
      state,
      _action: PayloadAction<CommonCodeGroupUpdateRequest>,
    ) {
      state.loading = true;
      state.error = null;
    },
    fetchCommonCodeGroupUpdateSuccess(state, action: PayloadAction<CommonCodeGroup>) {
      state.loading = false;
      // 같은 groupId 행만 교체 (useYn=N 이어도 목록에 유지)
      state.groups = state.groups.map((group) =>
        group.groupId === action.payload.groupId ? action.payload : group,
      );
    },
    fetchCommonCodeGroupUpdateFailure(state, action: PayloadAction<string>) {
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
  fetchCommonCodeGroupUpdateRequest,
  fetchCommonCodeGroupUpdateSuccess,
  fetchCommonCodeGroupUpdateFailure,
} = commonCodeGroupSlice.actions;

export default commonCodeGroupSlice.reducer;
