import { call, put, takeLatest } from "redux-saga/effects";
import { getMenus } from "@/features/system/api";
import { buildMenuTree } from "@/features/system/menuTree";
import {
  fetchMenusFailure,
  fetchMenusRequest,
  fetchMenusSuccess,
} from "@/features/system/slice";
import type { MenuItem } from "@/features/system/types";

/**
 * system saga
 * - API 호출은 여기서만 한다 (가이드 10.3)
 * - 흐름: Request → getMenus → buildMenuTree → Success / Failure
 */
function* fetchMenusSaga() {
  try {
    // 1) flat 목록 API
    const flat: MenuItem[] = yield call(getMenus);
    // 2) 트리 조립은 프론트 책임
    const tree = buildMenuTree(flat);
    // 3) 성공 action
    yield put(fetchMenusSuccess(tree));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "메뉴 조회에 실패했습니다.";
    yield put(fetchMenusFailure(message));
  }
}

export default function* systemSaga() {
  // fetchMenusRequest 가 올 때마다 최신 요청만 처리
  yield takeLatest(fetchMenusRequest.type, fetchMenusSaga);
}
