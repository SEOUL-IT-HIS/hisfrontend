import { call, put, takeLatest } from "redux-saga/effects";
import { saveConsultation } from "./api";
import { saveConsultationRequest, saveConsultationSuccess, saveConsultationFailure } from "./slice";
import type { ConsultationSaveResponse } from "./types";

function* saveConsultationSaga(action: ReturnType<typeof saveConsultationRequest>) {
    try {
        const result = (yield call(
            saveConsultation,
            action.payload.encounterId,
            action.payload.payload
        )) as ConsultationSaveResponse;
        yield put(saveConsultationSuccess(result));
    } catch (error) {
        const message = error instanceof Error ? error.message : "진료 저장에 실패했습니다.";
        yield put(saveConsultationFailure(message));
    }
}

export function* watchConsultationSaga() {
    yield takeLatest(saveConsultationRequest.type, saveConsultationSaga);
}
