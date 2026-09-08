import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  fetchImageFilesByOrderItemId,
  uploadImageFile,
} from "@/features/labimaging/imagingacquisition/api";
import {
  fetchImageFilesRequest,
  fetchImageFilesSuccess,
  fetchImageFilesFailure,
  uploadImageFileRequest,
  uploadImageFileSuccess,
  uploadImageFileFailure,
} from "@/features/labimaging/imagingacquisition/slice";
import type {
  ImageFileSummary,
  ImageFileUploadRequest,
} from "@/features/labimaging/imagingacquisition/types";

/**
 * imagingacquisition saga — API 호출은 여기서만 (가이드 10.3).
 * 실패 시 Error.message(백엔드 message)를 그대로 실어 보내고, 문구 변환은 컴포넌트에서 처리.
 */
function* fetchImageFilesSaga(action: PayloadAction<string>) {
  const imageOrderItemId = action.payload;
  try {
    const files: ImageFileSummary[] = yield call(
      fetchImageFilesByOrderItemId,
      imageOrderItemId,
    );
    yield put(fetchImageFilesSuccess({ imageOrderItemId, files }));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load image files.";
    yield put(fetchImageFilesFailure(message));
  }
}

/**
 * 업로드에 성공하면 그 항목의 영상파일 목록을 다시 불러온다.
 * 방금 올린 파일이 아래 목록에 바로 보여야 담당자가 결과를 확인할 수 있다.
 * (ConsentSaga.createConsentSaga 와 같은 구조)
 */
function* uploadImageFileSaga(action: PayloadAction<ImageFileUploadRequest>) {
  const request = action.payload;
  try {
    const uploaded: ImageFileSummary = yield call(uploadImageFile, request);
    yield put(uploadImageFileSuccess(uploaded));
    yield put(fetchImageFilesRequest(request.imageOrderItemId));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to upload image file.";
    yield put(uploadImageFileFailure(message));
  }
}

export default function* imageFileSaga() {
  yield takeLatest(fetchImageFilesRequest.type, fetchImageFilesSaga);
  yield takeLatest(uploadImageFileRequest.type, uploadImageFileSaga);
}
