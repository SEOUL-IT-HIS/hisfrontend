/**
 * [공통코드 그룹 Saga]
 *
 * Request 액션을 가로채 API 호출 후 Success/Failure 를 put
 *
 * takeLatest: 같은 요청이 연속이면 마지막만 처리
 */
import { call, put, takeLatest } from "redux-saga/effects";
import {
  fetchCommonCodeGroupApi,
  fetchCommonCodeGroupRegisterApi,
  fetchCommonCodeGroupUpdateApi,
} from "../api/commonCodeGroupApi";
import {
  fetchCommonCodeGroupFailure,
  fetchCommonCodeGroupRegisterFailure,
  fetchCommonCodeGroupRegisterRequest,
  fetchCommonCodeGroupRegisterSuccess,
  fetchCommonCodeGroupRequest,
  fetchCommonCodeGroupSuccess,
  fetchCommonCodeGroupUpdateFailure,
  fetchCommonCodeGroupUpdateRequest,
  fetchCommonCodeGroupUpdateSuccess,
} from "../slice/commonCodeGroupSlice";
import type { CommonCodeGroup } from "../types/commonCodeGroupTypes";

/** 목록 조회 */
function* fetchCommonCodeGroupSaga() {
  try {
    const groups: CommonCodeGroup[] = yield call(fetchCommonCodeGroupApi);
    yield put(fetchCommonCodeGroupSuccess(groups));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "공통코드 그룹 조회에 실패했습니다.";
    yield put(fetchCommonCodeGroupFailure(message));
  }
}

/** 등록 — action.payload = { groupCode, groupName, useYn } */
function* fetchCommonCodeGroupRegisterSaga(
  action: ReturnType<typeof fetchCommonCodeGroupRegisterRequest>,
) {
  try {
    const newGroup: CommonCodeGroup = yield call(
      fetchCommonCodeGroupRegisterApi,
      action.payload,
    );
    yield put(fetchCommonCodeGroupRegisterSuccess(newGroup));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "공통코드 그룹 등록에 실패했습니다.";
    yield put(fetchCommonCodeGroupRegisterFailure(message));
  }
}

/** 수정 — action.payload = { groupId, groupName, useYn } */
function* fetchCommonCodeGroupUpdateSaga(
  action: ReturnType<typeof fetchCommonCodeGroupUpdateRequest>,
) {
  try {
    const updatedGroup: CommonCodeGroup = yield call(
      fetchCommonCodeGroupUpdateApi,
      action.payload,
    );
    yield put(fetchCommonCodeGroupUpdateSuccess(updatedGroup));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "공통코드 그룹 수정에 실패했습니다.";
    yield put(fetchCommonCodeGroupUpdateFailure(message));
  }
}

/** rootSaga 에서 fork 되는 엔트리 */
export default function* commonCodeGroupSaga() {
  yield takeLatest(fetchCommonCodeGroupRequest.type, fetchCommonCodeGroupSaga);
  yield takeLatest(
    fetchCommonCodeGroupRegisterRequest.type,
    fetchCommonCodeGroupRegisterSaga,
  );
  yield takeLatest(fetchCommonCodeGroupUpdateRequest.type, fetchCommonCodeGroupUpdateSaga);
}
