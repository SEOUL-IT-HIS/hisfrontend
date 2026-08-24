import { all, fork } from "redux-saga/effects";
import { watchEncounterSaga } from "@/features/outpatient/encounter/saga";
import { watchMedicalRecordSaga } from "@/features/outpatient/medicalrecord/saga";
import { watchOutpatientCommonCodeSaga } from "@/features/outpatient/commonCode/saga";


export default function* outpatientSaga() {
    yield all([
        fork(watchEncounterSaga),
        fork(watchMedicalRecordSaga),
        fork(watchOutpatientCommonCodeSaga),
    ]);
}