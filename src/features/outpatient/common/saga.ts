import { all, fork } from "redux-saga/effects";
import { watchEncounterSaga } from "@/features/outpatient/encounter/saga";
// import { watchMedicalRecordSaga } from "@/features/outpatient/medicalrecord/saga";

/**
 * outpatient 도메인 결합 saga
 * - 하위 기능 saga 들을 fork 로 묶어 rootSaga 에서 한 번에 실행한다.
 *
 * TODO: medicalrecord saga 작성 후 아래에 함께 fork 한다.
 */
export default function* outpatientSaga() {
    yield all([
        fork(watchEncounterSaga),
        // fork(watchMedicalRecordSaga),
    ]);
}