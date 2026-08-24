import { combineReducers } from "@reduxjs/toolkit";
import encounterReducer from "@/features/outpatient/encounter/slice";
import medicalRecordReducer from "@/features/outpatient/medicalrecord/slice";
import commonCodeReducer from "@/features/outpatient/commonCode/slice";


const outpatientReducer = combineReducers({
    encounter: encounterReducer,
    medicalrecord: medicalRecordReducer,
    commonCode: commonCodeReducer,
});

export default outpatientReducer;