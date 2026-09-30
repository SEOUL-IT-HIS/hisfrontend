import { combineReducers } from "@reduxjs/toolkit";
import emsInfoReducer from "@/features/emergency/triage/emsInfo/slice";
import ktasReducer from "@/features/emergency/triage/ktas/slice";
import vitalsReducer from "@/features/emergency/triage/vitals/slice";
import isolationReducer from "@/features/emergency/triage/isolation/slice";
import riskScreeningReducer from "@/features/emergency/triage/riskScreening/slice";
import commonCodeReducer from "@/features/emergency/commonCode/slice";
import receptionListReducer from "@/features/emergency/receptionList/slice";
import bedReducer from "@/features/emergency/resource/bed/slice";
import clinicalNoteReducer from "@/features/emergency/care/clinicalNote/slice";
import consentReducer from "@/features/emergency/care/consent/slice";
import treatmentReducer from "@/features/emergency/care/treatment/slice";
import medicationReducer from "@/features/emergency/care/medication/slice";
import cprReducer from "@/features/emergency/care/cpr/slice";
import dispositionReducer from "@/features/emergency/disposition/slice";
import followUpReducer from "@/features/emergency/disposition/followup/slice";
import congestionReducer from "@/features/emergency/resource/congestion/slice";
import dashboardReducer from "@/features/emergency/monitor/slice";

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
  commonCode: commonCodeReducer,
  receptionList : receptionListReducer,
  bed: bedReducer,
  clinicalNote: clinicalNoteReducer,
  consent: consentReducer,
  treatment: treatmentReducer,
  medication: medicationReducer,
  cpr: cprReducer,
  disposition: dispositionReducer,
  followUp: followUpReducer,
  congestion: congestionReducer,
  dashboard: dashboardReducer,
});

export default emergencyReducer;
