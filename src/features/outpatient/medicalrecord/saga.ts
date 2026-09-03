import { call, put, takeLatest } from "redux-saga/effects";
import {
    fetchMedicalRecordList,
    fetchMedicalRecordDetail,
    updateMedicalRecord,
    deactivateMedicalRecord,
} from "./api";
import {
    fetchRecordListRequest,
    fetchRecordListSuccess,
    fetchRecordListFailure,
    fetchRecordDetailRequest,
    fetchRecordDetailSuccess,
    fetchRecordDetailFailure,
    updateRecordRequest,
    updateRecordSuccess,
    updateRecordFailure,
    deactivateRecordRequest,
    deactivateRecordSuccess,
    deactivateRecordFailure,
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

// 수정
function* updateRecordSaga(action: ReturnType<typeof updateRecordRequest>) {
    try {
        const updated = (yield call(
            updateMedicalRecord,
            action.payload.recordId,
            action.payload.params
        )) as MedicalRecordDto;

        // 수정 시에도 fileNames 유지 처리
        const mockUpdatedWithFiles: MedicalRecordDto = {
            ...updated,
            fileNames: action.payload.params.fileNames || []
        };

        yield put(updateRecordSuccess(mockUpdatedWithFiles));
    } catch (error) {
        const message = error instanceof Error ? error.message : "Medical record update failed";
        yield put(updateRecordFailure(message));
    }
}

// 비활성화
function* deactivateRecordSaga(action: ReturnType<typeof deactivateRecordRequest>) {
    try {
        yield call(deactivateMedicalRecord, action.payload.recordId, action.payload.userId);
        yield put(deactivateRecordSuccess(action.payload.recordId));
    } catch (error) {
        const message = error instanceof Error ? error.message : "Medical record deactivate failed";
        yield put(deactivateRecordFailure(message));
    }
}

export function* watchMedicalRecordSaga() {
    yield takeLatest(fetchRecordListRequest.type, fetchRecordListSaga);
    yield takeLatest(fetchRecordDetailRequest.type, fetchRecordDetailSaga);
    yield takeLatest(updateRecordRequest.type, updateRecordSaga);
    yield takeLatest(deactivateRecordRequest.type, deactivateRecordSaga);
}