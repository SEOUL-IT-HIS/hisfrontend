import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CommonCodeItem } from "../types/commonCodeItemTypes";
import type {CommonCodeGroup} from "@/features/commonCode/types/commonCodeGroupTypes";

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
        fetchCommonCodeItemRequest(state, action : PayloadAction<number>) {
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
            action: PayloadAction<Pick<CommonCodeItem, "groupId" | "codeName" | "useYn">>,
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
    },
});

export const {
    fetchCommonCodeItemRequest,
    fetchCommonCodeItemSuccess,
    fetchCommonCodeItemFailure,
    fetchCommonCodeItemRegisterRequest,
    fetchCommonCodeItemRegisterSuccess,
    fetchCommonCodeItemRegisterFailure
} = commonCodeItemSlice.actions;

export default commonCodeItemSlice.reducer;
