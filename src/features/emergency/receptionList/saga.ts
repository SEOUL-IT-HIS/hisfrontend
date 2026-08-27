import { call, put, takeLatest } from "redux-saga/effects";
import { getReceptionList } from "@/features/emergency/receptionList/api";
import {
    fetchReceptionListFailure,
    fetchReceptionListRequest,
    fetchReceptionListSuccess,
} from "@/features/emergency/receptionList/slice";
import type { ReceptionListItem } from "@/features/emergency/receptionList/types";

function* fetchReceptionListSaga() {
    try {
        const items: ReceptionListItem[] = yield call(getReceptionList);
        yield put(fetchReceptionListSuccess(items));
    } catch (err) {
        const message = err instanceof Error ? err.message : "접수 목록 조회에 실패했습니다.";
        yield put(fetchReceptionListFailure(message));
    }
}

export default function* receptionListSaga() {
    yield takeLatest(fetchReceptionListRequest.type, fetchReceptionListSaga);
}