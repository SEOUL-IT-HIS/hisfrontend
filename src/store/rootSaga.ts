import { all, fork } from "redux-saga/effects";
import systemSaga from "@/features/system/saga";

/**
 * RootSaga (프론트 리더 관리 영역)
 * - 서비스별 saga 를 fork 로 등록한다.
 * - API 호출은 각 서비스 saga 안에서만 한다.
 */
export default function* rootSaga() {
  yield all([fork(systemSaga)]);
}
