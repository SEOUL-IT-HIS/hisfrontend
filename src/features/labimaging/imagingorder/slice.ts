import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  ImageOrderCreateRequest,
  ImageOrderCreateResponse,
  ImageOrderState,
} from "@/features/labimaging/imagingorder/types";

/**
 * imageOrder(영상 오더 접수) slice
 * - laborder 과 동일 패턴 (상태만 관리, API 는 saga)
 *
 * Action prefix "labImaging/" 유지 (가이드 10.2 / 요청서 3.1)
 * createSlice name = "labImaging/imagingorder"
 */
const initialState: ImageOrderState = {
  creating: false,
  createError: "",
  lastCreated: null,
};

const imageOrderSlice = createSlice({
  name: "labImaging/imagingorder",
  initialState,
  reducers: {
    // payload(요청값)는 saga 가 소비하므로 prepare 로 타입만 실어 보낸다.
    createImageOrderRequest: {
      reducer(state) {
        state.creating = true;
        state.createError = "";
      },
      prepare(request: ImageOrderCreateRequest) {
        return { payload: request };
      },
    },
    createImageOrderSuccess(
      state,
      action: PayloadAction<ImageOrderCreateResponse>,
    ) {
      state.creating = false;
      state.createError = "";
      state.lastCreated = action.payload;
    },
    createImageOrderFailure(state, action: PayloadAction<string>) {
      state.creating = false;
      state.createError = action.payload;
    },
    resetImageOrderResult(state) {
      state.createError = "";
      state.lastCreated = null;
    },
  },
});

export const {
  createImageOrderRequest,
  createImageOrderSuccess,
  createImageOrderFailure,
  resetImageOrderResult,
} = imageOrderSlice.actions;

export default imageOrderSlice.reducer;

// ----- Selector (가이드 10.4) -----
// 등록 전제: labImaging: combineReducers({ laborder, imagingorder })
type ImageOrderRoot = {
  labImaging: { imagingorder: ImageOrderState };
};

export const selectImageOrderCreating = (state: ImageOrderRoot) =>
  state.labImaging.imagingorder.creating;
export const selectImageOrderCreateError = (state: ImageOrderRoot) =>
  state.labImaging.imagingorder.createError;
export const selectLastCreatedImageOrder = (state: ImageOrderRoot) =>
  state.labImaging.imagingorder.lastCreated;
