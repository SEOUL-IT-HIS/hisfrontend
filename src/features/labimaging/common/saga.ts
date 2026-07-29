import { all, fork } from "redux-saga/effects";
import labOrderSaga from "@/features/labimaging/laborder/saga";
import imageOrderSaga from "@/features/labimaging/imagingorder/saga";
import labScheduleSaga from "@/features/labimaging/labschedule/saga";

/**
 * labImaging 도메인 결합 saga
 * - 하위 기능 saga 들을 fork 로 묶어 rootSaga 에서 한 번에 실행한다.
 *
 * TODO: labschedule / imagingschedule saga 작성 후 아래에 함께 fork 한다.
 */
export default function* labImagingSaga() {
  yield all([
    fork(labOrderSaga),
    fork(imageOrderSaga),
    fork(labScheduleSaga),
  ]);
}
