import { combineReducers } from "@reduxjs/toolkit";
import encounterReducer from "@/features/outpatient/encounter/slice";
// import medicalRecordReducer from "@/features/outpatient/medicalrecord/slice";

/**
 * outpatient 도메인 결합 reducer
 * - 하위 기능 slice 들을 하나로 묶어 rootReducer 에 outpatient 키로 등록한다.
 * - 각 slice 의 selector 가 state.outpatient.<기능> 을 참조하므로 아래 키 이름을
 *   반드시 그대로 맞춘다. (encounter/slice.ts selector 참고)
 */
const outpatientReducer = combineReducers({
    encounter: encounterReducer,
    // medicalrecord: medicalRecordReducer, TODO: medicalrecord slice 작성 후 주석 해제
});

export default outpatientReducer;