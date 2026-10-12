import { call, put, takeEvery, takeLatest, takeLeading } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  deleteReferenceDocument,
  getReferenceDocuments,
  uploadReferenceDocument,
} from "@/features/emergency/reference/api";
import {
  deleteReferenceDocumentFailure,
  deleteReferenceDocumentRequest,
  deleteReferenceDocumentSuccess,
  fetchReferenceDocumentsFailure,
  fetchReferenceDocumentsRequest,
  fetchReferenceDocumentsSuccess,
  uploadReferenceDocumentFailure,
  uploadReferenceDocumentRequest,
  uploadReferenceDocumentSuccess,
} from "@/features/emergency/reference/slice";
import { takeUploadFile } from "@/features/emergency/reference/uploadHold";
import type {
  ReferenceDocument,
  ReferenceDocumentDeleteRequest,
  ReferenceDocumentUploadRequest,
} from "@/features/emergency/reference/types";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function* fetchReferenceDocumentsSaga() {
  try {
    const items: ReferenceDocument[] = yield call(getReferenceDocuments);
    yield put(fetchReferenceDocumentsSuccess(items));
  } catch (err) {
    // 참고 문서 목록을 불러오지 못했습니다.
    yield put(fetchReferenceDocumentsFailure(errorMessage(err, "Failed to load reference documents.")));
  }
}

function* uploadReferenceDocumentSaga(action: PayloadAction<ReferenceDocumentUploadRequest>) {
  const { fileKey, title, category, uploadedById } = action.payload;
  const file = takeUploadFile(fileKey);
  if (!file) {
    // 선택한 파일을 찾을 수 없습니다. 다시 선택해 주세요.
    yield put(uploadReferenceDocumentFailure("The selected file could not be found. Please select it again."));
    return;
  }
  try {
    const item: ReferenceDocument = yield call(uploadReferenceDocument, { file, title, category, uploadedById });
    yield put(uploadReferenceDocumentSuccess(item));
  } catch (err) {
    // 참고 문서를 올리지 못했습니다.
    yield put(uploadReferenceDocumentFailure(errorMessage(err, "Failed to upload the document.")));
  }
}

function* deleteReferenceDocumentSaga(action: PayloadAction<ReferenceDocumentDeleteRequest>) {
  try {
    yield call(deleteReferenceDocument, action.payload.id, action.payload.deletedById);
    yield put(deleteReferenceDocumentSuccess(action.payload.id));
  } catch (err) {
    // 참고 문서를 삭제하지 못했습니다.
    yield put(deleteReferenceDocumentFailure(errorMessage(err, "Failed to delete the document.")));
  }
}

export default function* referenceDocumentSaga() {
  yield takeLatest(fetchReferenceDocumentsRequest.type, fetchReferenceDocumentsSaga);
  // 올리는 중에는 새 업로드를 받지 않는다(화면도 버튼을 막는다)
  yield takeLeading(uploadReferenceDocumentRequest.type, uploadReferenceDocumentSaga);
  yield takeEvery(deleteReferenceDocumentRequest.type, deleteReferenceDocumentSaga);
}
