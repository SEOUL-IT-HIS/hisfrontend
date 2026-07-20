import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  ImageOrderCreateRequest,
  ImageOrderCreateResponse,
  ImagingAcquisitionState,
} from "@/features/labimaging/imagingacquisition/types";

/**
 * imagingAcquisition(영상 오더 접수) slice
 * - labspecimen 과 동일 패턴 (상태만 관리, API 는 saga)
 *
 * Action prefix "labImaging/" 유지 (가이드 10.2 / 요청서 3.1)
 * createSlice name = "labImaging/imagingacquisition"
 */
const initialState: ImagingAcquisitionState = {
  creating: false,
  createError: "",
  lastCreated: null,
};

const imagingAcquisitionSlice = createSlice({
  name: "labImaging/imagingacquisition",
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
} = imagingAcquisitionSlice.actions;

export default imagingAcquisitionSlice.reducer;

// ----- Selector (가이드 10.4) -----
// 등록 전제: labImaging: combineReducers({ labspecimen, imagingacquisition })
type ImagingAcquisitionRoot = {
  labImaging: { imagingacquisition: ImagingAcquisitionState };
};

export const selectImageOrderCreating = (state: ImagingAcquisitionRoot) =>
  state.labImaging.imagingacquisition.creating;
export const selectImageOrderCreateError = (state: ImagingAcquisitionRoot) =>
  state.labImaging.imagingacquisition.createError;
export const selectLastCreatedImageOrder = (state: ImagingAcquisitionRoot) =>
  state.labImaging.imagingacquisition.lastCreated;
