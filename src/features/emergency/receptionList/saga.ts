import { call, put, takeLatest } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import { getReceptionList } from "@/features/emergency/receptionList/api";
import {
    fetchReceptionListFailure,
    fetchReceptionListRequest,
    fetchReceptionListSuccess,
} from "@/features/emergency/receptionList/slice";
import type { ReceptionListItem } from "@/features/emergency/receptionList/types";

function* fetchReceptionListSaga(action: PayloadAction<string | undefined>) {
    try {
        const items: ReceptionListItem[] = yield call(getReceptionList, action.payload);
        yield put(fetchReceptionListSuccess(items));
    } catch (err) {
        // 접수 목록 조회에 실패했습니다.
        const message = err instanceof Error ? err.message : "Failed to load the reception list.";
        yield put(fetchReceptionListFailure(message));
    }
}

export default function* receptionListSaga() {
    yield takeLatest(fetchReceptionListRequest.type, fetchReceptionListSaga);
}