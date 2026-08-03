/**
 * [인증 Saga]
 * Request 액션을 가로채 API 호출 후 Success/Failure 를 put
 *
 * TODO: authApi 연동
 */
import { takeLatest } from "redux-saga/effects";
import {
  fetchAuthLoginRequest,
  fetchAuthLogoutRequest,
  fetchAuthMeRequest,
} from "../slice/authSlice";

function* fetchAuthLoginSaga(
  _action: ReturnType<typeof fetchAuthLoginRequest>,
) {
  // TODO: call(fetchAuthLoginApi) → put Success/Failure
}

function* fetchAuthMeSaga() {
  // TODO: call(fetchAuthMeApi) → put Success/Failure
}

function* fetchAuthLogoutSaga() {
  // TODO: call(fetchAuthLogoutApi) → put Success/Failure
}

/** rootSaga 에서 fork 되는 엔트리 */
export default function* authSaga() {
  yield takeLatest(fetchAuthLoginRequest.type, fetchAuthLoginSaga);
  yield takeLatest(fetchAuthMeRequest.type, fetchAuthMeSaga);
  yield takeLatest(fetchAuthLogoutRequest.type, fetchAuthLogoutSaga);
}
