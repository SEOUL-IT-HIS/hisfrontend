/**
 * [외래(OPD) 공통코드 로컬 캐시 Slice]
 *
 * outpatient 영역 전용 캐시. 다른 서비스(surgery/labimaging 등)가 쓰는
 * features/commonCode 쪽 상태·훅은 건드리지 않고, 여기서 outpatient.commonCode 로 독립 관리한다.
 */
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CommonCodeItem } from "@/features/commonCode/types/commonCodeItemTypes";

type CommonCodeCacheStatus = "idle" | "loading" | "loaded" | "error";

type OutpatientCommonCodeState = {
  itemsByGroupCode: Record<string, CommonCodeItem[]>;
  status: CommonCodeCacheStatus;
  error: string | null;
};

const initialState: OutpatientCommonCodeState = {
  itemsByGroupCode: {},
  status: "idle",
  error: null,
};

const outpatientCommonCodeSlice = createSlice({
  name: "outpatientCommonCode",
  initialState,
  reducers: {
    loadAllCommonCodesRequest(state) {
      state.status = "loading";
      state.error = null;
    },
    loadAllCommonCodesSuccess(state, action: PayloadAction<Record<string, CommonCodeItem[]>>) {
      state.status = "loaded";
      state.itemsByGroupCode = action.payload;
    },
    loadAllCommonCodesFailure(state, action: PayloadAction<string>) {
      state.status = "error";
      state.error = action.payload;
    },
  },
});

export const {
  loadAllCommonCodesRequest,
  loadAllCommonCodesSuccess,
  loadAllCommonCodesFailure,
} = outpatientCommonCodeSlice.actions;

export default outpatientCommonCodeSlice.reducer;
