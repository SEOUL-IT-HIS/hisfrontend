import { call, put, takeLatest } from "redux-saga/effects";
import {
    fetchPrescriptionList,
    fetchPrescriptionDetail,
    deactivatePrescription,
} from "./api";
import {
    fetchPrescriptionListRequest,
    fetchPrescriptionListSuccess,
    fetchPrescriptionListFailure,
    fetchPrescriptionDetailRequest,
    fetchPrescriptionDetailSuccess,
    fetchPrescriptionDetailFailure,
    deactivatePrescriptionRequest,
    deactivatePrescriptionSuccess,
    deactivatePrescriptionFailure,
} from "./slice";
import type { PrescriptionDto } from "./types";

// 목록 조회
function* fetchPrescriptionListSaga(action: ReturnType<typeof fetchPrescriptionListRequest>) {
    try {
        const items = (yield call(fetchPrescriptionList, action.payload)) as PrescriptionDto[];
        yield put(fetchPrescriptionListSuccess(items));
    } catch (error) {
        const message = error instanceof Error ? error.message : "Prescription list fetch failed";
        yield put(fetchPrescriptionListFailure(message));
    }
}

// 상세 조회
function* fetchPrescriptionDetailSaga(action: ReturnType<typeof fetchPrescriptionDetailRequest>) {
    try {
        const item = (yield call(fetchPrescriptionDetail, action.payload)) as PrescriptionDto;
        yield put(fetchPrescriptionDetailSuccess(item));
    } catch (error) {
        const message = error instanceof Error ? error.message : "Prescription detail fetch failed";
        yield put(fetchPrescriptionDetailFailure(message));
    }

}

// 비활성화
function* deactivatePrescriptionSaga(action: ReturnType<typeof deactivatePrescriptionRequest>) {
    try {
        yield call(
            deactivatePrescription,
            action.payload.prescriptionId,
            action.payload.cancelReason,
            action.payload.userId
        );
        yield put(deactivatePrescriptionSuccess({
            prescriptionId: action.payload.prescriptionId,
            cancelReason: action.payload.cancelReason,
        }));
    } catch (error) {
        const message = error instanceof Error ? error.message : "Prescription deactivate failed";
        yield put(deactivatePrescriptionFailure(message));
    }
}

export function* watchPrescriptionSaga() {
    yield takeLatest(fetchPrescriptionListRequest.type, fetchPrescriptionListSaga);
    yield takeLatest(fetchPrescriptionDetailRequest.type, fetchPrescriptionDetailSaga);
    yield takeLatest(deactivatePrescriptionRequest.type, deactivatePrescriptionSaga);
}