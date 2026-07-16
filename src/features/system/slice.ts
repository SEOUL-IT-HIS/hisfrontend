import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { MenuTreeNode } from "@/features/system/types";

/**
 * system slice
 * - 메뉴 목록 상태만 관리
 * - API 호출은 여기서 하지 않는다 → saga 가 담당
 *
 * Action 이름 규칙 (가이드 10.2)
 * - Request / Success / Failure
 * - prefix: system/...  (createSlice name = "system")
 */
type SystemState = {
  /** FE에서 조립한 L0/L1 메뉴 트리 */
  menuTree: MenuTreeNode[];
  loading: boolean;
  error: string;
};

const initialState: SystemState = {
  menuTree: [],
  loading: false,
  error: "",
};

const systemSlice = createSlice({
  name: "system",
  initialState,
  reducers: {
    /** 메뉴 조회 시작 → saga 가 이 action 을 듣고 API 호출 */
    fetchMenusRequest(state) {
      state.loading = true;
      state.error = "";
    },
    /** 메뉴 조회 성공 */
    fetchMenusSuccess(state, action: PayloadAction<MenuTreeNode[]>) {
      state.menuTree = action.payload;
      state.loading = false;
      state.error = "";
    },
    /** 메뉴 조회 실패 */
    fetchMenusFailure(state, action: PayloadAction<string>) {
      state.menuTree = [];
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const { fetchMenusRequest, fetchMenusSuccess, fetchMenusFailure } =
  systemSlice.actions;

export default systemSlice.reducer;

// ----- Selector (가이드 10.4: 컴포넌트에서 state.xxx.yyy 깊게 파지 않기) -----

type SystemRoot = { system: SystemState };

export const selectMenuTree = (state: SystemRoot) => state.system.menuTree;
export const selectMenuLoading = (state: SystemRoot) => state.system.loading;
export const selectMenuError = (state: SystemRoot) => state.system.error;
