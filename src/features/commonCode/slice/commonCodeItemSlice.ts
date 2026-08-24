/**
 * [공통코드 항목 Redux Slice]
 *
 * 상태: items / loading / error
 *
 * fetchCommonCodeItemRequest payload = groupId (string, UUID)
 * → saga 가 그 groupId 로 목록 API 호출
 *
 * 검색 필터는 이 slice 에 넣지 않음.
 * 화면(CommonCodeItemPanel) 에서 items 를 useMemo 로 필터.
 */
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  CommonCodeItem,
  CommonCodeItemRegisterRequest,
  CommonCodeItemUpdateRequest,
} from "../types/commonCodeItemTypes";

type CommonCodeState = {
  items: CommonCodeItem[];
  loading: boolean;
  error: string | null;
};

const initialState: CommonCodeState = {
  items: [],
  loading: false,
  error: null,
};

const commonCodeItemSlice = createSlice({
  name: "commonCodeItem",
  initialState,
  reducers: {
    // ----- 목록 조회 (payload: groupId) -----
    fetchCommonCodeItemRequest(state, _action: PayloadAction<string>) {
      state.loading = true;
      state.error = null;
    },
    fetchCommonCodeItemSuccess(state, action: PayloadAction<CommonCodeItem[]>) {
      state.loading = false;
      state.items = action.payload;
    },
    fetchCommonCodeItemFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // ----- 등록 -----
    fetchCommonCodeItemRegisterRequest(
      state,
      _action: PayloadAction<CommonCodeItemRegisterRequest>,
    ) {
      state.loading = true;
      state.error = null;
    },
    fetchCommonCodeItemRegisterSuccess(state, action: PayloadAction<CommonCodeItem>) {
      state.loading = false;
      state.items.push(action.payload);
    },
    fetchCommonCodeItemRegisterFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // ----- 수정 -----
    fetchCommonCodeItemUpdateRequest(
      state,
      _action: PayloadAction<CommonCodeItemUpdateRequest>,
    ) {
      state.loading = true;
      state.error = null;
    },
    fetchCommonCodeItemUpdateSuccess(state, action: PayloadAction<CommonCodeItem>) {
      state.loading = false;
      // useYn=N 이어도 목록에서 제거하지 않음 (관리 화면에서 다시 Y 로 변경 가능)
      state.items = state.items.map((item) =>
        item.codeId === action.payload.codeId ? action.payload : item,
      );
    },
    fetchCommonCodeItemUpdateFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchCommonCodeItemRequest,
  fetchCommonCodeItemSuccess,
  fetchCommonCodeItemFailure,
  fetchCommonCodeItemRegisterRequest,
  fetchCommonCodeItemRegisterSuccess,
  fetchCommonCodeItemRegisterFailure,
  fetchCommonCodeItemUpdateRequest,
  fetchCommonCodeItemUpdateSuccess,
  fetchCommonCodeItemUpdateFailure,
} = commonCodeItemSlice.actions;

export default commonCodeItemSlice.reducer;
