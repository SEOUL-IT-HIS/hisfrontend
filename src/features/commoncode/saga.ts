import { call, put, takeEvery, takeLatest } from "redux-saga/effects";
import {
  createCommonCode,
  createCommonCodeGroup,
  deleteCommonCode,
  deleteCommonCodeGroup,
  getCommonCodeGroups,
  getCommonCodes,
  updateCommonCode,
  updateCommonCodeGroup,
} from "@/features/commoncode/api";
import {
  createCommonCodeFailure,
  createCommonCodeGroupFailure,
  createCommonCodeGroupRequest,
  createCommonCodeGroupSuccess,
  createCommonCodeRequest,
  createCommonCodeSuccess,
  deleteCommonCodeFailure,
  deleteCommonCodeGroupFailure,
  deleteCommonCodeGroupRequest,
  deleteCommonCodeGroupSuccess,
  deleteCommonCodeRequest,
  deleteCommonCodeSuccess,
  fetchCommonCodeGroupsFailure,
  fetchCommonCodeGroupsRequest,
  fetchCommonCodeGroupsSuccess,
  fetchCommonCodesFailure,
  fetchCommonCodesRequest,
  fetchCommonCodesSuccess,
  fetchManageCodesFailure,
  fetchManageCodesRequest,
  fetchManageCodesSuccess,
  updateCommonCodeFailure,
  updateCommonCodeGroupFailure,
  updateCommonCodeGroupRequest,
  updateCommonCodeGroupSuccess,
  updateCommonCodeRequest,
  updateCommonCodeSuccess,
} from "@/features/commoncode/slice";
import type {
  CommonCodeGroup,
  CommonCodeItem,
  CreateCommonCodeGroupRequest,
  CreateCommonCodeRequest,
  UpdateCommonCodeGroupRequest,
  UpdateCommonCodeRequest,
} from "@/features/commoncode/types";
import type { PayloadAction } from "@reduxjs/toolkit";

function* fetchCommonCodesSaga(
  action: PayloadAction<{ groupCode: string; useYn?: string; keyword?: string }>,
) {
  const { groupCode, useYn = "Y", keyword } = action.payload;
  try {
    const items: CommonCodeItem[] = yield call(
      getCommonCodes,
      groupCode,
      useYn,
      keyword,
    );
    yield put(fetchCommonCodesSuccess({ groupCode, items }));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "공통코드 조회에 실패했습니다.";
    yield put(fetchCommonCodesFailure(message));
  }
}

function* fetchManageCodesSaga(
  action: PayloadAction<{ groupCode: string; useYn?: string; keyword?: string }>,
) {
  const { groupCode, useYn, keyword } = action.payload;
  try {
    const items: CommonCodeItem[] = yield call(
      getCommonCodes,
      groupCode,
      useYn,
      keyword,
    );
    yield put(fetchManageCodesSuccess(items));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "공통코드 항목 목록 조회에 실패했습니다.";
    yield put(fetchManageCodesFailure(message));
  }
}

function* createCommonCodeSaga(action: PayloadAction<CreateCommonCodeRequest>) {
  try {
    const created: CommonCodeItem = yield call(createCommonCode, action.payload);
    yield put(createCommonCodeSuccess(created));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "공통코드 항목 등록에 실패했습니다.";
    yield put(createCommonCodeFailure(message));
  }
}

function* updateCommonCodeSaga(
  action: PayloadAction<{ codeId: number; payload: UpdateCommonCodeRequest }>,
) {
  try {
    const updated: CommonCodeItem = yield call(
      updateCommonCode,
      action.payload.codeId,
      action.payload.payload,
    );
    yield put(updateCommonCodeSuccess(updated));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "공통코드 항목 수정에 실패했습니다.";
    yield put(updateCommonCodeFailure(message));
  }
}

function* deleteCommonCodeSaga(action: PayloadAction<number>) {
  try {
    yield call(deleteCommonCode, action.payload);
    yield put(deleteCommonCodeSuccess(action.payload));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "공통코드 항목 삭제에 실패했습니다.";
    yield put(deleteCommonCodeFailure(message));
  }
}

function* fetchCommonCodeGroupsSaga() {
  try {
    const list: CommonCodeGroup[] = yield call(getCommonCodeGroups);
    yield put(fetchCommonCodeGroupsSuccess(list));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "공통코드 그룹 목록 조회에 실패했습니다.";
    yield put(fetchCommonCodeGroupsFailure(message));
  }
}

function* createCommonCodeGroupSaga(
  action: PayloadAction<CreateCommonCodeGroupRequest>,
) {
  try {
    const created: CommonCodeGroup = yield call(
      createCommonCodeGroup,
      action.payload,
    );
    yield put(createCommonCodeGroupSuccess(created));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "공통코드 그룹 등록에 실패했습니다.";
    yield put(createCommonCodeGroupFailure(message));
  }
}

function* updateCommonCodeGroupSaga(
  action: PayloadAction<{ groupId: number; payload: UpdateCommonCodeGroupRequest }>,
) {
  try {
    const updated: CommonCodeGroup = yield call(
      updateCommonCodeGroup,
      action.payload.groupId,
      action.payload.payload,
    );
    yield put(updateCommonCodeGroupSuccess(updated));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "공통코드 그룹 수정에 실패했습니다.";
    yield put(updateCommonCodeGroupFailure(message));
  }
}

function* deleteCommonCodeGroupSaga(action: PayloadAction<number>) {
  try {
    yield call(deleteCommonCodeGroup, action.payload);
    yield put(deleteCommonCodeGroupSuccess(action.payload));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "공통코드 그룹 삭제에 실패했습니다.";
    yield put(deleteCommonCodeGroupFailure(message));
  }
}

export default function* commonCodeSaga() {
  yield takeEvery(fetchCommonCodesRequest.type, fetchCommonCodesSaga);
  yield takeLatest(fetchManageCodesRequest.type, fetchManageCodesSaga);
  yield takeLatest(createCommonCodeRequest.type, createCommonCodeSaga);
  yield takeLatest(updateCommonCodeRequest.type, updateCommonCodeSaga);
  yield takeLatest(deleteCommonCodeRequest.type, deleteCommonCodeSaga);
  yield takeLatest(fetchCommonCodeGroupsRequest.type, fetchCommonCodeGroupsSaga);
  yield takeLatest(createCommonCodeGroupRequest.type, createCommonCodeGroupSaga);
  yield takeLatest(updateCommonCodeGroupRequest.type, updateCommonCodeGroupSaga);
  yield takeLatest(deleteCommonCodeGroupRequest.type, deleteCommonCodeGroupSaga);
}
