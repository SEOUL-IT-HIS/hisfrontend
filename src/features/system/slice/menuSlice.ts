// ============================================================
// Menu Redux Slice — features/system/menuSlice
// ============================================================

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { MenuTreeNode } from "../types/menuTypes";

type MenuState = {
  items: MenuTreeNode[];
  loading: boolean;
  error: string | null;
};

const initialState: MenuState = {
  items: [],
  loading: false,
  error: null,
};

const menuSlice = createSlice({
  name: "menu",
  initialState,
  reducers: {
    fetchMenuRequest(state) {
      state.loading = true;
      state.error = null;
    },
    fetchMenuSuccess(state, action: PayloadAction<MenuTreeNode[]>) {
      state.loading = false;
      state.items = action.payload;
    },
    fetchMenuFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchMenuRequest,
  fetchMenuSuccess,
  fetchMenuFailure,
} = menuSlice.actions;

export default menuSlice.reducer;
