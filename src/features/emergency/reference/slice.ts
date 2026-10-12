import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  ReferenceDocument,
  ReferenceDocumentDeleteRequest,
  ReferenceDocumentState,
  ReferenceDocumentUploadRequest,
} from "@/features/emergency/reference/types";

/** 응급 참고 문서 slice — 환자와 무관한 문서 목록·업로드·삭제 */
const initialState: ReferenceDocumentState = {
  items: [],
  loading: false,
  error: "",
  uploading: false,
  uploadError: "",
  deletingId: "",
  deleteError: "",
};

const byUploadedAtDesc = (a: ReferenceDocument, b: ReferenceDocument) => b.uploadedAt.localeCompare(a.uploadedAt);

const referenceDocumentSlice = createSlice({
  name: "emergency/referenceDocument",
  initialState,
  reducers: {
    fetchReferenceDocumentsRequest(state) {
      state.loading = true;
      state.error = "";
    },
    fetchReferenceDocumentsSuccess(state, action: PayloadAction<ReferenceDocument[]>) {
      state.loading = false;
      state.error = "";
      state.items = action.payload;
    },
    fetchReferenceDocumentsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    uploadReferenceDocumentRequest: {
      reducer(state) {
        state.uploading = true;
        state.uploadError = "";
      },
      prepare(request: ReferenceDocumentUploadRequest) {
        return { payload: request };
      },
    },
    uploadReferenceDocumentSuccess(state, action: PayloadAction<ReferenceDocument>) {
      state.uploading = false;
      state.uploadError = "";
      // 서버 정렬(올린 시각 최신순)과 같은 순서를 유지한다.
      state.items = [action.payload, ...state.items.filter((item) => item.id !== action.payload.id)].sort(byUploadedAtDesc);
    },
    uploadReferenceDocumentFailure(state, action: PayloadAction<string>) {
      state.uploading = false;
      state.uploadError = action.payload;
    },
    deleteReferenceDocumentRequest: {
      reducer(state, action: PayloadAction<ReferenceDocumentDeleteRequest>) {
        state.deletingId = action.payload.id;
        state.deleteError = "";
      },
      prepare(request: ReferenceDocumentDeleteRequest) {
        return { payload: request };
      },
    },
    deleteReferenceDocumentSuccess(state, action: PayloadAction<string>) {
      state.deletingId = "";
      state.deleteError = "";
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    deleteReferenceDocumentFailure(state, action: PayloadAction<string>) {
      state.deletingId = "";
      state.deleteError = action.payload;
    },
  },
});

export const {
  fetchReferenceDocumentsRequest,
  fetchReferenceDocumentsSuccess,
  fetchReferenceDocumentsFailure,
  uploadReferenceDocumentRequest,
  uploadReferenceDocumentSuccess,
  uploadReferenceDocumentFailure,
  deleteReferenceDocumentRequest,
  deleteReferenceDocumentSuccess,
  deleteReferenceDocumentFailure,
} = referenceDocumentSlice.actions;

export default referenceDocumentSlice.reducer;

// ----- Selector (가이드 10.4) -----
type ReferenceDocumentRoot = { emergency: { referenceDocument: ReferenceDocumentState } };

export const selectReferenceDocuments = (state: ReferenceDocumentRoot) => state.emergency.referenceDocument.items;
export const selectReferenceDocumentsLoading = (state: ReferenceDocumentRoot) => state.emergency.referenceDocument.loading;
export const selectReferenceDocumentsError = (state: ReferenceDocumentRoot) => state.emergency.referenceDocument.error;
export const selectReferenceDocumentUploading = (state: ReferenceDocumentRoot) => state.emergency.referenceDocument.uploading;
export const selectReferenceDocumentUploadError = (state: ReferenceDocumentRoot) =>
  state.emergency.referenceDocument.uploadError;
export const selectReferenceDocumentDeletingId = (state: ReferenceDocumentRoot) => state.emergency.referenceDocument.deletingId;
export const selectReferenceDocumentDeleteError = (state: ReferenceDocumentRoot) =>
  state.emergency.referenceDocument.deleteError;
