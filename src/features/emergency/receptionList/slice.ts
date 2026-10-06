import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ReceptionListItem, ReceptionListState } from "@/features/emergency/receptionList/types";

const initialState: ReceptionListState = {
    items: [],
    loading: false,
    error: "",
    statusFilter: undefined,
    cancelCheck: {},
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
        // 선택해 둔 환자가 갱신된 목록에서 사라졌을 때, 접수에서 취소된 것인지 한 번 확인한다
        checkReceptionCancelledRequest(state, action: PayloadAction<string>) {
            state.cancelCheck[action.payload] = { state: "checking", at: Date.now() };
        },
        checkReceptionCancelledResult(state, action: PayloadAction<{ receptionId: string; cancelled: boolean; at: number }>) {
            state.cancelCheck[action.payload.receptionId] = {
                state: action.payload.cancelled ? "cancelled" : "active",
                at: action.payload.at,
            };
        },
    },
});

export const {
    fetchReceptionListRequest,
    refreshReceptionListRequest,
    fetchReceptionListSuccess,
    fetchReceptionListFailure,
    checkReceptionCancelledRequest,
    checkReceptionCancelledResult,
} = receptionListSlice.actions;
export default receptionListSlice.reducer;

type ReceptionListRoot = { emergency: { receptionList: ReceptionListState } };

export const selectReceptionListItems = (state: ReceptionListRoot) => state.emergency.receptionList.items;
export const selectReceptionListLoading = (state: ReceptionListRoot) => state.emergency.receptionList.loading;
export const selectReceptionListStatusFilter = (state: ReceptionListRoot) => state.emergency.receptionList.statusFilter;
/** 이 접수에 대한 취소 확인 상태(없으면 아직 안 물었다) */
export const selectReceptionCancelCheck = (receptionId: string) => (state: ReceptionListRoot) =>
    state.emergency.receptionList.cancelCheck[receptionId];
/** 접수에서 취소된 접수인지 — 목록에 취소로 보이거나, 목록에서 사라진 뒤 확인해 취소로 확인된 경우 */
export const selectIsReceptionCancelled = (receptionId: string) => (state: ReceptionListRoot) =>
    !!receptionId &&
    (state.emergency.receptionList.items.some((item) => item.receptionId === receptionId && item.careStatusCode === "CANCELLED") ||
        state.emergency.receptionList.cancelCheck[receptionId]?.state === "cancelled");
export const selectReceptionListError = (state: ReceptionListRoot) => state.emergency.receptionList.error;