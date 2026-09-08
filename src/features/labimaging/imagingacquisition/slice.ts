import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  ImageFileState,
  ImageFileSummary,
  ImageFileUploadRequest,
} from "@/features/labimaging/imagingacquisition/types";

/**
 * imagingacquisition(촬영/영상파일) slice
 * - 상태만 관리하고 API 호출은 하지 않는다 → saga 가 담당 (가이드 10.3)
 */
const initialState: ImageFileState = {
  files: [],
  filesLoading: false,
  filesError: "",
  loadedImageOrderItemId: null,

  uploading: false,
  uploadError: "",
  lastUploaded: null,
};

const imageFileSlice = createSlice({
  name: "labImaging/imagingacquisition",
  initialState,
  reducers: {
    // ---------- 촬영항목의 영상파일 목록 조회 ----------
    fetchImageFilesRequest: {
      reducer(state) {
        state.filesLoading = true;
        state.filesError = "";
      },
      prepare(imageOrderItemId: string) {
        return { payload: imageOrderItemId };
      },
    },
    /**
     * ⚠ 목록과 함께 "어느 항목의 것인지"도 받는다. (ConsentSlice.fetchConsentsSuccess 와 같은 이유)
     *   결과가 0건일 때 목록만으로는 어느 항목의 것인지 알 수 없다.
     */
    fetchImageFilesSuccess(
      state,
      action: PayloadAction<{ imageOrderItemId: string; files: ImageFileSummary[] }>,
    ) {
      state.filesLoading = false;
      state.files = action.payload.files;
      state.loadedImageOrderItemId = action.payload.imageOrderItemId;
    },
    fetchImageFilesFailure(state, action: PayloadAction<string>) {
      state.filesLoading = false;
      state.filesError = action.payload;
    },

    // ---------- 영상파일 업로드 ----------
    uploadImageFileRequest: {
      reducer(state) {
        state.uploading = true;
        state.uploadError = "";
      },
      prepare(request: ImageFileUploadRequest) {
        return { payload: request };
      },
    },
    uploadImageFileSuccess(state, action: PayloadAction<ImageFileSummary>) {
      state.uploading = false;
      state.uploadError = "";
      state.lastUploaded = action.payload;
    },
    uploadImageFileFailure(state, action: PayloadAction<string>) {
      state.uploading = false;
      state.uploadError = action.payload;
    },

    /** 다른 촬영항목을 고르면 이전 항목의 목록/업로드 결과가 남아 있으면 안 된다. */
    resetImageFileState(state) {
      state.files = [];
      state.filesError = "";
      state.loadedImageOrderItemId = null;
      state.uploadError = "";
      state.lastUploaded = null;
    },
  },
});

export const {
  fetchImageFilesRequest,
  fetchImageFilesSuccess,
  fetchImageFilesFailure,
  uploadImageFileRequest,
  uploadImageFileSuccess,
  uploadImageFileFailure,
  resetImageFileState,
} = imageFileSlice.actions;

export default imageFileSlice.reducer;

// ----- Selector (가이드 10.4: 컴포넌트에서 state.xxx.yyy 깊게 접근 금지) -----
type ImageFileRoot = { labImaging: { imagingacquisition: ImageFileState } };

export const selectImageFiles = (s: ImageFileRoot) =>
  s.labImaging.imagingacquisition.files;
export const selectImageFilesLoading = (s: ImageFileRoot) =>
  s.labImaging.imagingacquisition.filesLoading;
export const selectImageFilesError = (s: ImageFileRoot) =>
  s.labImaging.imagingacquisition.filesError;
export const selectLoadedImageFileItemId = (s: ImageFileRoot) =>
  s.labImaging.imagingacquisition.loadedImageOrderItemId;

export const selectImageFileUploading = (s: ImageFileRoot) =>
  s.labImaging.imagingacquisition.uploading;
export const selectImageFileUploadError = (s: ImageFileRoot) =>
  s.labImaging.imagingacquisition.uploadError;
export const selectLastUploadedImageFile = (s: ImageFileRoot) =>
  s.labImaging.imagingacquisition.lastUploaded;
