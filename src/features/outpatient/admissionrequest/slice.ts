import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import type {
    AdmissionRequestCreatePayload,
    AdmissionRequestDto,
    AdmissionRequestListParams,
    AdmissionRequestPage,
    AdmissionRequestPageParams,
} from "./types";

interface AdmissionRequestState {
    // 목록이 어느 진료(encounterId)의 것인지 — 환자를 바꿨을 때 이전 환자의 요청이 잠깐 보이지 않게 한다
    encounterId: string | null;
    list: AdmissionRequestDto[];
    listStatus: { loading: boolean; error: string | null };
    createStatus: { loading: boolean; error: string | null };
    // 재전송 중인 요청(admissionRequestId)을 함께 기억해 해당 행의 버튼만 막는다
    dispatchStatus: { loading: boolean; error: string | null; admissionRequestId: string | null };
    // 입원요청 목록 화면(모든 의사의 요청, 페이지 단위)
    pageList: AdmissionRequestPage;
    pageStatus: { loading: boolean; error: string | null };
}

const initialState: AdmissionRequestState = {
    encounterId: null,
    list: [],
    listStatus: { loading: false, error: null },
    pageList: { content: [], totalElements: 0 },
    pageStatus: { loading: false, error: null },
    createStatus: { loading: false, error: null },
    dispatchStatus: { loading: false, error: null, admissionRequestId: null },
};

const admissionRequestSlice = createSlice({
    name: "admissionRequest",
    initialState,
    reducers: {
        fetchAdmissionRequestListRequest: (state, action: PayloadAction<AdmissionRequestListParams>) => {
            const { encounterId, silent } = action.payload;
            // 다른 진료로 바뀌면 이전 진료의 목록과 처리 결과 메시지를 비운다
            if (state.encounterId !== encounterId) {
                state.encounterId = encounterId;
                state.list = [];
                state.createStatus = { loading: false, error: null };
                state.dispatchStatus = { loading: false, error: null, admissionRequestId: null };
            }
            // 자동 갱신(silent)은 "불러오는 중" 표시 없이 목록만 조용히 바꾼다
            // (직접 조회할 때는 이전 등록/재전송 실패 메시지도 함께 지운다)
            if (!silent) {
                state.listStatus.loading = true;
                state.createStatus.error = null;
                state.dispatchStatus.error = null;
            }
            state.listStatus.error = null;
        },
        fetchAdmissionRequestListSuccess: (
            state,
            action: PayloadAction<{ encounterId: string; items: AdmissionRequestDto[] }>
        ) => {
            // 응답을 기다리는 사이 다른 진료로 바뀌었으면 버린다
            if (state.encounterId !== action.payload.encounterId) return;
            state.listStatus.loading = false;
            state.list = action.payload.items;
        },
        fetchAdmissionRequestListFailure: (state, action: PayloadAction<string>) => {
            state.listStatus.loading = false;
            state.listStatus.error = action.payload;
        },

        fetchAdmissionRequestPageRequest: (state, action: PayloadAction<AdmissionRequestPageParams>) => {
            // 자동 갱신(silent)은 "불러오는 중" 표시 없이 목록만 조용히 바꾼다
            if (!action.payload.silent) {
                state.pageStatus.loading = true;
            }
            state.pageStatus.error = null;
        },
        fetchAdmissionRequestPageSuccess: (state, action: PayloadAction<AdmissionRequestPage>) => {
            state.pageStatus.loading = false;
            state.pageList = action.payload;
        },
        fetchAdmissionRequestPageFailure: (state, action: PayloadAction<string>) => {
            state.pageStatus.loading = false;
            state.pageStatus.error = action.payload;
        },

        createAdmissionRequestRequest: (
            state,
            _action: PayloadAction<{ encounterId: string; payload: AdmissionRequestCreatePayload }>
        ) => {
            state.createStatus.loading = true;
            state.createStatus.error = null;
        },
        createAdmissionRequestSuccess: (state, action: PayloadAction<AdmissionRequestDto>) => {
            state.createStatus.loading = false;
            if (state.encounterId === action.payload.encounterId) {
                state.list = [
                    action.payload,
                    ...state.list.filter(
                        (item) => item.admissionRequestId !== action.payload.admissionRequestId
                    ),
                ];
            }
        },
        createAdmissionRequestFailure: (state, action: PayloadAction<string>) => {
            state.createStatus.loading = false;
            state.createStatus.error = action.payload;
        },

        dispatchAdmissionRequestRequest: (state, action: PayloadAction<string>) => {
            state.dispatchStatus = { loading: true, error: null, admissionRequestId: action.payload };
        },
        dispatchAdmissionRequestSuccess: (state, action: PayloadAction<AdmissionRequestDto>) => {
            state.dispatchStatus = { loading: false, error: null, admissionRequestId: null };
            state.list = state.list.map((item) =>
                item.admissionRequestId === action.payload.admissionRequestId ? action.payload : item
            );
        },
        dispatchAdmissionRequestFailure: (state, action: PayloadAction<string>) => {
            state.dispatchStatus = { ...state.dispatchStatus, loading: false, error: action.payload };
        },
    },
});

export const {
    fetchAdmissionRequestListRequest,
    fetchAdmissionRequestListSuccess,
    fetchAdmissionRequestListFailure,
    fetchAdmissionRequestPageRequest,
    fetchAdmissionRequestPageSuccess,
    fetchAdmissionRequestPageFailure,
    createAdmissionRequestRequest,
    createAdmissionRequestSuccess,
    createAdmissionRequestFailure,
    dispatchAdmissionRequestRequest,
    dispatchAdmissionRequestSuccess,
    dispatchAdmissionRequestFailure,
} = admissionRequestSlice.actions;
export default admissionRequestSlice.reducer;
