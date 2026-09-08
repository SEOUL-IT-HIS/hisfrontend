/**
 * [역할별 메뉴 권한 Saga]
 *
 * Request → API → Success/Failure
 * fetchRoleMenuRequest.payload = roleId
 */
import { call, put, takeLatest } from "redux-saga/effects";
import { fetchRoleMenuApi, fetchRoleMenuSaveApi } from "../api/roleMenuApi";
import {
  fetchRoleMenuFailure,
  fetchRoleMenuRequest,
  fetchRoleMenuSaveFailure,
  fetchRoleMenuSaveRequest,
  fetchRoleMenuSaveSuccess,
  fetchRoleMenuSuccess,
} from "../slice/roleMenuSlice";
import type { RoleMenu } from "../types/roleMenuTypes";

/** 목록 — action.payload = roleId */
function* fetchRoleMenuSaga(action: ReturnType<typeof fetchRoleMenuRequest>) {
  try {
    const roleMenus: RoleMenu[] = yield call(fetchRoleMenuApi, action.payload);
    yield put(fetchRoleMenuSuccess(roleMenus));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "메뉴 권한 조회에 실패했습니다.";
    yield put(fetchRoleMenuFailure(message));
  }
}

/**
 * 저장 — action.payload = { roleId, menuIds }
 *
 * 저장 API 는 응답에 데이터가 없어서(ApiResponse<Void>),
 * 저장이 끝나면 목록을 다시 조회해서 최신 상태를 Success 에 실어 보낸다.
 * (화면에서 상태를 직접 계산해 맞추는 것보다, DB 에 실제로 저장된 결과를 받는 게 확실하다)
 */
function* fetchRoleMenuSaveSaga(action: ReturnType<typeof fetchRoleMenuSaveRequest>) {
  try {
    yield call(fetchRoleMenuSaveApi, action.payload);
    const roleMenus: RoleMenu[] = yield call(fetchRoleMenuApi, action.payload.roleId);
    yield put(fetchRoleMenuSaveSuccess(roleMenus));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "메뉴 권한 저장에 실패했습니다.";
    yield put(fetchRoleMenuSaveFailure(message));
  }
}

export default function* roleMenuSaga() {
  yield takeLatest(fetchRoleMenuRequest.type, fetchRoleMenuSaga);
  yield takeLatest(fetchRoleMenuSaveRequest.type, fetchRoleMenuSaveSaga);
}