import { combineReducers } from "@reduxjs/toolkit";
import anesthesiaReducer from "@/features/surgery/anesthesia/slice";
import checklistReducer from "@/features/surgery/checklist/slice";
import consentReducer from "@/features/surgery/consent/slice";
import operativeRecordReducer from "@/features/surgery/operativeRecord/slice";
import roomReducer from "@/features/surgery/room/slice";
import scheduleReducer from "@/features/surgery/schedule/slice";

/**
 * surgery 도메인 결합 reducer
 *
 * <p>하위 기능 slice 들을 하나로 묶어 rootReducer 에 surgery 키로 등록한다.
 * 각 slice 의 selector 가 state.surgery.&lt;기능&gt; 을 참조하므로 아래 키 이름을
 * 반드시 그대로 맞춘다(room/slice.ts, schedule/slice.ts 등의 selector 참고).</p>
 *
 * <p>백엔드가 구현된 도메인만 등록한다. 간호기록은 백엔드 API 는 있으나 화면이 아직
 * 없어 slice 를 만들지 않았다 — 필요해지면 checklist 와 같은 방식으로 추가한다.</p>
 */
const surgeryReducer = combineReducers({
  room: roomReducer,
  schedule: scheduleReducer,
  anesthesia: anesthesiaReducer,
  operativeRecord: operativeRecordReducer,
  consent: consentReducer,
  checklist: checklistReducer,
});

export default surgeryReducer;
