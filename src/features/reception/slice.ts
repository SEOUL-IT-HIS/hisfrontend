import { combineReducers } from "@reduxjs/toolkit";
import receptionManagementReducer from "@/features/reception/receptionmanagement/slice";
import patientManagementReducer from "@/features/reception/patientmanagement/slice";

/**
 * reception 도메인 결합 reducer
 * - 하위 기능 slice 들을 하나로 묶어 rootReducer 에 reception 키로 등록한다.
 * - 각 slice 의 selector 가 state.reception.<기능> 을 참조하므로 아래 키 이름을
 *   반드시 그대로 맞춘다. (receptionmanagement/slice.ts, patientmanagement/slice.ts selector 참고)
 */
const receptionReducer = combineReducers({
  receptionmanagement: receptionManagementReducer,
  patientmanagement: patientManagementReducer,
});

export default receptionReducer;
