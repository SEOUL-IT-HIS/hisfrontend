import { call, put, takeLatest } from "redux-saga/effects";
import {fetchCommonCodeGroupApi, fetchCommonCodeGroupRegisterApi} from "../api/commonCodeGroupApi";
import {
  fetchCommonCodeGroupFailure, fetchCommonCodeGroupRegisterFailure, fetchCommonCodeGroupRegisterRequest,
  fetchCommonCodeGroupRegisterSuccess,
  fetchCommonCodeGroupRequest,
  fetchCommonCodeGroupSuccess,
} from "../slice/commonCodeGroupSlice";
import type { CommonCodeGroup } from "../types/commonCodeGroupTypes";

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

function* fetchCommonCodeGroupRegisterSaga(action: ReturnType<typeof fetchCommonCodeGroupRegisterRequest>) {
  try {
    const newGroup: CommonCodeGroup = yield call(fetchCommonCodeGroupRegisterApi, action.payload);
    yield put(fetchCommonCodeGroupRegisterSuccess(newGroup));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "공통코드 그룹 등록에 실패했습니다.";
    yield put(fetchCommonCodeGroupRegisterFailure(message));
  }
}


export default function* commonCodeGroupSaga() {
  yield takeLatest(fetchCommonCodeGroupRequest.type, fetchCommonCodeGroupSaga);
  yield takeLatest(fetchCommonCodeGroupRegisterRequest.type, fetchCommonCodeGroupRegisterSaga);
}
