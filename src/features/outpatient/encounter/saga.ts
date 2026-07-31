// ============================================================
// Encounter Redux Saga — features/outpatient/encounter/saga
// API 호출: api.ts → slice action dispatch
// ============================================================

import { call, put, takeLatest } from "redux-saga/effects";
import { fetchEncounterList } from "./api";
import {
    fetchEncounterListFailure,
    fetchEncounterListRequest,
    fetchEncounterListSuccess,
} from "./slice";
import type { EncounterDto } from "./types";

// --- 목록 조회: EncounterList.tsx → GET /api/outpatient/encounters ---
function* fetchEncounterListSaga(action: ReturnType<typeof fetchEncounterListRequest>) {
    try {
        const items: EncounterDto[] = yield call(fetchEncounterList, action.payload);
        yield put(fetchEncounterListSuccess(items));
    } catch (error) {
        const message = error instanceof Error ? error.message : "Encounter list fetch failed";
        yield put(fetchEncounterListFailure(message));
    }
}

export function* watchEncounterSaga() {
    yield takeLatest(fetchEncounterListRequest.type, fetchEncounterListSaga);
}