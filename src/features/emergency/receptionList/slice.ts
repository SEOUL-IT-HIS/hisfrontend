import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ReceptionListItem, ReceptionListState } from "@/features/emergency/receptionList/types";

const initialState: ReceptionListState = {
    items: [],
    loading: false,
    error: "",
    statusFilter: undefined,
};

const receptionListSlice = createSlice({
    name: "emergency/receptionList",
    initialState,
    reducers: {
        fetchReceptionListRequest: {
            reducer(state, action: PayloadAction<string | undefined>) {
                state.loading = true;
                state.error = "";
                // 화면이 마지막으로 요청한 상태 필터(undefined = 전체). 다른 곳의 새로고침이 이 필터로 다시 불러온다.
                state.statusFilter = action.payload;
            },
            prepare(status?: string) {
                return { payload: status };
            },
        },
        // 필터는 그대로 두고 지금 보고 있는 목록만 조용히 다시 불러온다(KTAS 등록 뒤 배지 갱신, 주기적 갱신).
        // 로딩 표시를 켜지 않아 표가 깜빡이지 않는다.
        refreshReceptionListRequest() {},
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

export const {
    fetchReceptionListRequest,
    refreshReceptionListRequest,
    fetchReceptionListSuccess,
    fetchReceptionListFailure,
} = receptionListSlice.actions;
export default receptionListSlice.reducer;

type ReceptionListRoot = { emergency: { receptionList: ReceptionListState } };

export const selectReceptionListItems = (state: ReceptionListRoot) => state.emergency.receptionList.items;
export const selectReceptionListLoading = (state: ReceptionListRoot) => state.emergency.receptionList.loading;
export const selectReceptionListStatusFilter = (state: ReceptionListRoot) => state.emergency.receptionList.statusFilter;
export const selectReceptionListError = (state: ReceptionListRoot) => state.emergency.receptionList.error;