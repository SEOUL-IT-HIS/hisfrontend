/**
 * [인증 Saga]
 * Request 액션을 가로채 API 호출 후 Success/Failure 를 put
 *
 * 로그인 성공 시 userInfo 를 localStorage 에 저장 (BE 세션과 별도, 화면용)
 */
import { call, put, takeLatest } from "redux-saga/effects";
import {
  fetchAuthLoginApi,
  fetchAuthLogoutApi,
  fetchAuthMeApi,
} from "../api/authApi";
import {
  fetchAuthLoginFailure,
  fetchAuthLoginRequest,
  fetchAuthLoginSuccess,
  fetchAuthLogoutFailure,
  fetchAuthLogoutRequest,
  fetchAuthLogoutSuccess,
  fetchAuthMeFailure,
  fetchAuthMeRequest,
  fetchAuthMeSuccess,
} from "../slice/authSlice";
import type { AuthUser } from "../types/authTypes";
import { resetStore } from "@/store/resetStoreAction";

const USER_INFO_KEY = "userInfo";

function* fetchAuthLoginSaga(
  action: ReturnType<typeof fetchAuthLoginRequest>,
) {
  try {
    const user: AuthUser = yield call(fetchAuthLoginApi, action.payload);
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
    yield put(fetchAuthLoginSuccess(user));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "로그인에 실패했습니다.";
    yield put(fetchAuthLoginFailure(message));
  }
}

function* fetchAuthMeSaga() {
  try {
    const user: AuthUser = yield call(fetchAuthMeApi);
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
    yield put(fetchAuthMeSuccess(user));
  } catch (error) {
    localStorage.removeItem(USER_INFO_KEY);
    const message =
      error instanceof Error ? error.message : "세션 확인에 실패했습니다.";
    yield put(fetchAuthMeFailure(message));
  }
}

function* fetchAuthLogoutSaga() {
  try {
    yield call(fetchAuthLogoutApi);
    localStorage.removeItem(USER_INFO_KEY);
    yield put(fetchAuthLogoutSuccess());
    // store 전체를 초기 상태로 되돌린다 (rootReducer.ts 참고 — 잔여 상태 방지)
    yield put(resetStore());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "로그아웃에 실패했습니다.";
    yield put(fetchAuthLogoutFailure(message));
  }
}

/** rootSaga 에서 fork 되는 엔트리 */
export default function* authSaga() {
  yield takeLatest(fetchAuthLoginRequest.type, fetchAuthLoginSaga);
  yield takeLatest(fetchAuthMeRequest.type, fetchAuthMeSaga);
  yield takeLatest(fetchAuthLogoutRequest.type, fetchAuthLogoutSaga);
}
