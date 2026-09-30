import { all, fork } from "redux-saga/effects";
import { watchEncounterSaga } from "@/features/outpatient/encounter/saga";
import { watchMedicalRecordSaga } from "@/features/outpatient/medicalrecord/saga";
import { watchOutpatientCommonCodeSaga } from "@/features/outpatient/commonCode/saga";
import { watchPrescriptionSaga } from "@/features/outpatient/prescription/saga";
import { watchConsultationSaga } from "@/features/outpatient/consultation/saga";


export default function* outpatientSaga() {
    yield all([
        fork(watchEncounterSaga),
        fork(watchMedicalRecordSaga),
        fork(watchOutpatientCommonCodeSaga),
        fork(watchPrescriptionSaga),
        fork(watchConsultationSaga),
    ]);
}