import { combineReducers } from "@reduxjs/toolkit";
import laborderReducer from "@/features/labimaging/laborder/slice";
import imagingorderReducer from "@/features/labimaging/imagingorder/slice";
import labScheduleReducer from "@/features/labimaging/labschedule/slice";
import imageScheduleReducer from "@/features/labimaging/imagingschedule/slice";
import labSpecimenReducer from "@/features/labimaging/labspecimen/slice";
import consentReducer from "@/features/labimaging/imagingacquisition/slice";
import labResultReducer from "@/features/labimaging/labresult/slice";
/**
 * labImaging 도메인 결합 reducer
 * - 하위 기능 slice 들을 하나로 묶어 rootReducer 에 labImaging 키로 등록한다.
 * - 각 slice 의 selector 가 state.labImaging.<기능> 을 참조하므로 아래 키 이름을
 *   반드시 그대로 맞춘다. (laborder/slice.ts, imagingorder/slice.ts selector 참고)
 */
const labImagingReducer = combineReducers({
  laborder: laborderReducer,
  imagingorder: imagingorderReducer,
  labschedule: labScheduleReducer,
  imagingschedule: imageScheduleReducer,
  labspecimen: labSpecimenReducer,
  imagingacquisition: consentReducer,
  labresult: labResultReducer,
});

export default labImagingReducer;
