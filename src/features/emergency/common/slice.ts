import { combineReducers } from "@reduxjs/toolkit";
import emsInfoReducer from "@/features/emergency/emsInfo/slice";
import ktasReducer from "@/features/emergency/ktas/slice";
import vitalsReducer from "@/features/emergency/vitals/slice";

/**
 * emergency 도메인 결합 reducer
 * - 하위 기능 slice 들을 하나로 묶어 rootReducer 에 emergency 키로 등록한다.
 * - 각 slice 의 selector 가 state.emergency.<기능> 을 참조하므로 아래 키 이름을
 *   반드시 그대로 맞춘다.
 * - 이 PR 범위: emsInfo(UD2-8) / ktas(UD2-9,43) / vitals(UD2-10) 까지만 포함.
 *   격리(UD2-11)·위험스크리닝(UD2-12)은 별도 PR에서 추가 예정.
 */
const emergencyReducer = combineReducers({
  emsInfo: emsInfoReducer,
  ktas: ktasReducer,
  vitals: vitalsReducer,
});

export default emergencyReducer;
