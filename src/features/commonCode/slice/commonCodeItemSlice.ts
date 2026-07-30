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
    // 코드 아이템 조회
    fetchCommonCodeItemRequest(state, action: PayloadAction<number>) {
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
    // 코드 아이템 등록
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
    // 코드 아이템 수정
    fetchCommonCodeItemUpdateRequest(
      state,
      _action: PayloadAction<CommonCodeItemUpdateRequest>,
    ) {
      state.loading = true;
      state.error = null;
    },
    fetchCommonCodeItemUpdateSuccess(state, action: PayloadAction<CommonCodeItem>) {
      state.loading = false;
      // useYn N 이어도 목록에 유지 (관리 화면에서 다시 Y 로 바꿀 수 있게)
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
