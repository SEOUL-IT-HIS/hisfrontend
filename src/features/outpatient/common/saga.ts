import { all, fork } from "redux-saga/effects";
import { watchEncounterSaga } from "@/features/outpatient/encounter/saga";
import { watchMedicalRecordSaga } from "@/features/outpatient/medicalrecord/saga";


export default function* outpatientSaga() {
    yield all([
        fork(watchEncounterSaga),
        fork(watchMedicalRecordSaga),
    ]);
}