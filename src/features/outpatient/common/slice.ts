import { combineReducers } from "@reduxjs/toolkit";
import encounterReducer from "@/features/outpatient/encounter/slice";
import medicalRecordReducer from "@/features/outpatient/medicalrecord/slice";
import commonCodeReducer from "@/features/outpatient/commonCode/slice";
import prescriptionReducer from "@/features/outpatient/prescription/slice";


const outpatientReducer = combineReducers({
    encounter: encounterReducer,
    medicalrecord: medicalRecordReducer,
    commonCode: commonCodeReducer,
    prescription: prescriptionReducer,
});

export default outpatientReducer;