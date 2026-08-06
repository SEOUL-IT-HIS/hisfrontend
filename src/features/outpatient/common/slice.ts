import { combineReducers } from "@reduxjs/toolkit";
import encounterReducer from "@/features/outpatient/encounter/slice";
import medicalRecordReducer from "@/features/outpatient/medicalrecord/slice";


const outpatientReducer = combineReducers({
    encounter: encounterReducer,
    medicalrecord: medicalRecordReducer,
});

export default outpatientReducer;