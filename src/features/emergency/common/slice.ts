import { combineReducers } from "@reduxjs/toolkit";
import emsInfoReducer from "@/features/emergency/emsInfo/slice";
import ktasReducer from "@/features/emergency/ktas/slice";
import vitalsReducer from "@/features/emergency/vitals/slice";
import isolationReducer from "@/features/emergency/isolation/slice";
import riskScreeningReducer from "@/features/emergency/riskScreening/slice";

/**
 * emergency 도메인 결합 reducer
 * - 하위 기능 slice 들을 하나로 묶어 rootReducer 에 emergency 키로 등록한다.
 * - 각 slice 의 selector 가 state.emergency.<기능> 을 참조하므로 아래 키 이름을
 *   반드시 그대로 맞춘다.
 */
const emergencyReducer = combineReducers({
  emsInfo: emsInfoReducer,
  ktas: ktasReducer,
  vitals: vitalsReducer,
  isolation: isolationReducer,
  riskScreening: riskScreeningReducer,
});

export default emergencyReducer;
