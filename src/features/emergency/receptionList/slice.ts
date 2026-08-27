import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ReceptionListItem, ReceptionListState } from "@/features/emergency/receptionList/types";

const initialState: ReceptionListState = {
    items: [],
    loading: false,
    error: "",
};

const receptionListSlice = createSlice({
    name: "emergency/receptionList",
    initialState,
    reducers: {
        fetchReceptionListRequest(state) {
            state.loading = true;
            state.error = "";
        },
        fetchReceptionListSuccess(state, action: PayloadAction<ReceptionListItem[]>) {
            state.loading = false;
            state.items = action.payload;
        },
        fetchReceptionListFailure(state, action: PayloadAction<string>) {
            state.loading = false;
            state.error = action.payload;
        },
    },
});

export const { fetchReceptionListRequest, fetchReceptionListSuccess, fetchReceptionListFailure } =
    receptionListSlice.actions;
export default receptionListSlice.reducer;

type ReceptionListRoot = { emergency: { receptionList: ReceptionListState } };

export const selectReceptionListItems = (state: ReceptionListRoot) => state.emergency.receptionList.items;
export const selectReceptionListLoading = (state: ReceptionListRoot) => state.emergency.receptionList.loading;
export const selectReceptionListError = (state: ReceptionListRoot) => state.emergency.receptionList.error;