import { call, put, select, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import { getReceptionList } from "@/features/emergency/receptionList/api";
import {
    fetchReceptionListFailure,
    fetchReceptionListRequest,
    fetchReceptionListSuccess,
    refreshReceptionListRequest,
    selectReceptionListStatusFilter,
} from "@/features/emergency/receptionList/slice";
import type { ReceptionListItem } from "@/features/emergency/receptionList/types";

function* fetchReceptionListSaga(action: PayloadAction<string | undefined>) {
    try {
        // refresh 는 payload 가 없다 — 화면이 마지막으로 쓴 필터로 다시 불러온다(전체로 바뀌어 목록이 늘어나지 않게)
        const status: string | undefined =
            action.type === refreshReceptionListRequest.type ? yield select(selectReceptionListStatusFilter) : action.payload;
        const items: ReceptionListItem[] = yield call(getReceptionList, status);
        yield put(fetchReceptionListSuccess(items));
    } catch (err) {
        // 접수 목록 조회에 실패했습니다.
        const message = err instanceof Error ? err.message : "Failed to load the reception list.";
        yield put(fetchReceptionListFailure(message));
    }
}

export default function* receptionListSaga() {
    yield takeLatest([fetchReceptionListRequest.type, refreshReceptionListRequest.type], fetchReceptionListSaga);
}