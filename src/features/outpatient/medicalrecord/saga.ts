import { call, put, takeLatest } from "redux-saga/effects";
import { fetchMedicalRecordList, fetchMedicalRecordDetail } from "./api";
import {
    fetchRecordListRequest,
    fetchRecordListSuccess,
    fetchRecordListFailure,
    fetchRecordDetailRequest,
    fetchRecordDetailSuccess,
    fetchRecordDetailFailure,
} from "./slice";
import type { MedicalRecordDto } from "./types";

// 목록 조회
function* fetchRecordListSaga(action: ReturnType<typeof fetchRecordListRequest>) {
    try {
        const items = (yield call(fetchMedicalRecordList, action.payload)) as MedicalRecordDto[];
        yield put(fetchRecordListSuccess(items));
    } catch (error) {
        const message = error instanceof Error ? error.message : "Medical record list fetch failed";
        yield put(fetchRecordListFailure(message));
    }
}

// 상세 조회
function* fetchRecordDetailSaga(action: ReturnType<typeof fetchRecordDetailRequest>) {
    try {
        const item = (yield call(fetchMedicalRecordDetail, action.payload)) as MedicalRecordDto;
        yield put(fetchRecordDetailSuccess(item));
    } catch (error) {
        const message = error instanceof Error ? error.message : "Medical record detail fetch failed";
        yield put(fetchRecordDetailFailure(message));
    }
}

export function* watchMedicalRecordSaga() {
    yield takeLatest(fetchRecordListRequest.type, fetchRecordListSaga);
    yield takeLatest(fetchRecordDetailRequest.type, fetchRecordDetailSaga);
}