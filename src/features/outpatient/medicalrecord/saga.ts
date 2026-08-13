import { call, put, takeLatest } from "redux-saga/effects";
import {
    fetchMedicalRecordList,
    fetchMedicalRecordDetail,
    createMedicalRecord,
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
    createRecordRequest,
    createRecordSuccess,
    createRecordFailure,
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

// 등록
function* createRecordSaga(action: ReturnType<typeof createRecordRequest>) {
    try {
        // 기존처럼 서버에 진료기록 데이터(JSON) 전송
        const created = (yield call(createMedicalRecord, action.payload)) as MedicalRecordDto;

        // 백엔드는 파일을 모르므로, 프론트가 보낸 fileNames가 있다면 강제로 붙여줌 (가라 데이터 시뮬레이션)
        const mockCreatedWithFiles: MedicalRecordDto = {
            ...created,
            fileNames: action.payload.fileNames || []
        };

        yield put(createRecordSuccess(mockCreatedWithFiles));
    } catch (error) {
        const message = error instanceof Error ? error.message : "Medical record create failed";
        yield put(createRecordFailure(message));
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
    yield takeLatest(createRecordRequest.type, createRecordSaga);
    yield takeLatest(updateRecordRequest.type, updateRecordSaga);
    yield takeLatest(deactivateRecordRequest.type, deactivateRecordSaga);
}