import { all, fork } from "redux-saga/effects";
import receptionManagementSaga from "@/features/reception/receptionmanagement/saga";
import patientManagementSaga from "@/features/reception/patientmanagement/saga";

/**
 * reception 도메인 결합 saga
 * - 하위 기능 saga 들을 fork 로 묶어 rootSaga 에서 한 번에 실행한다.
 */
export default function* receptionSaga() {
  yield all([fork(receptionManagementSaga), fork(patientManagementSaga)]);
}
