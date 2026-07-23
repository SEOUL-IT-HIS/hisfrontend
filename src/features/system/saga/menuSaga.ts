// ============================================================
// Menu Redux Saga — features/system/menuSaga
// ============================================================

import { call, put, takeLatest } from "redux-saga/effects";
import { fetchMenuApi } from "../api/menuApi";
import {
  fetchMenuFailure,
  fetchMenuRequest,
  fetchMenuSuccess,
} from "../slice/menuSlice";
import type { MenuTreeNode } from "../types/menuTypes";

function* fetchMenuSaga() {
  try {
    const items: MenuTreeNode[] = yield call(fetchMenuApi);
    yield put(fetchMenuSuccess(items));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Menu fetch failed";
    yield put(fetchMenuFailure(message));
  }
}

export default function* menuSaga() {
  yield takeLatest(fetchMenuRequest.type, fetchMenuSaga);
}
