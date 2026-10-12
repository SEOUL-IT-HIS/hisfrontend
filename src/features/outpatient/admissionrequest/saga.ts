import { call, put, takeLatest, takeLeading } from "redux-saga/effects";

import {
    createAdmissionRequest,
    dispatchAdmissionRequest,
    fetchAdmissionRequestList,
    fetchAdmissionRequestPage,
} from "./api";
import {
    createAdmissionRequestFailure,
    createAdmissionRequestRequest,
    createAdmissionRequestSuccess,
    dispatchAdmissionRequestFailure,
    dispatchAdmissionRequestRequest,
    dispatchAdmissionRequestSuccess,
    fetchAdmissionRequestListFailure,
    fetchAdmissionRequestListRequest,
    fetchAdmissionRequestListSuccess,
    fetchAdmissionRequestPageFailure,
    fetchAdmissionRequestPageRequest,
    fetchAdmissionRequestPageSuccess,
} from "./slice";
import type { AdmissionRequestDto, AdmissionRequestPage } from "./types";

// 입원요청 목록 조회 GET /api/outpatient/admission-requests
function* fetchAdmissionRequestPageSaga(action: ReturnType<typeof fetchAdmissionRequestPageRequest>) {
    const { requestStatus, page, size } = action.payload;
    try {
        const result: AdmissionRequestPage = yield call(fetchAdmissionRequestPage, { requestStatus, page, size });
        yield put(fetchAdmissionRequestPageSuccess(result));
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load admission requests.";
        yield put(fetchAdmissionRequestPageFailure(message));
    }
}

// 목록 조회 GET /api/outpatient/encounters/{encounterId}/admission-requests
function* fetchAdmissionRequestListSaga(action: ReturnType<typeof fetchAdmissionRequestListRequest>) {
    const { encounterId } = action.payload;
    try {
        const items: AdmissionRequestDto[] = yield call(fetchAdmissionRequestList, encounterId);
        yield put(fetchAdmissionRequestListSuccess({ encounterId, items: items ?? [] }));
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load admission requests.";
        yield put(fetchAdmissionRequestListFailure(message));
    }
}

// 등록 POST /api/outpatient/encounters/{encounterId}/admission-requests
function* createAdmissionRequestSaga(action: ReturnType<typeof createAdmissionRequestRequest>) {
    const { encounterId, payload } = action.payload;
    try {
        const created: AdmissionRequestDto = yield call(createAdmissionRequest, encounterId, payload);
        yield put(createAdmissionRequestSuccess(created));
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to send the admission request.";
        yield put(createAdmissionRequestFailure(message));
        // 이미 진행 중인 요청이 있다는 응답(409) 등은 화면 목록이 서버와 달랐다는 뜻이라 조용히 다시 불러온다
        yield put(fetchAdmissionRequestListRequest({ encounterId, silent: true }));
    }
}

// 재전송 POST /api/outpatient/admission-requests/{admissionRequestId}/dispatch
function* dispatchAdmissionRequestSaga(action: ReturnType<typeof dispatchAdmissionRequestRequest>) {
    try {
        const updated: AdmissionRequestDto = yield call(dispatchAdmissionRequest, action.payload);
        yield put(dispatchAdmissionRequestSuccess(updated));
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to resend the admission request.";
        yield put(dispatchAdmissionRequestFailure(message));
    }
}

export function* watchAdmissionRequestSaga() {
    yield takeLatest(fetchAdmissionRequestListRequest.type, fetchAdmissionRequestListSaga);
    // 필터/페이지를 빠르게 바꾸면 마지막 조회만 반영한다
    yield takeLatest(fetchAdmissionRequestPageRequest.type, fetchAdmissionRequestPageSaga);
    // 등록/재전송은 처리 중에 들어온 같은 요청(더블 클릭 등)을 무시한다
    yield takeLeading(createAdmissionRequestRequest.type, createAdmissionRequestSaga);
    yield takeLeading(dispatchAdmissionRequestRequest.type, dispatchAdmissionRequestSaga);
}
