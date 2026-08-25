import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MedicalRecordCreateParams, MedicalRecordDto, MedicalRecordSearchParams, MedicalRecordUpdateParams } from "./types";

interface MedicalRecordState {
    // 목록 조회 상태
    listStatus: { loading: boolean; error: string | null };
    list: MedicalRecordDto[];

    // 상세 조회 상태
    detailStatus: { loading: boolean; error: string | null };
    selectedRecord: MedicalRecordDto | null;

    // 등록 상태
    createStatus: { loading: boolean; error: string | null };

    // 수정 상태
    updateStatus: { loading: boolean; error: string | null };

    // 비활성화 상태
    deactivateStatus: { loading: boolean; error: string | null };
}

const initialState: MedicalRecordState = {
    listStatus: { loading: false, error: null },
    list: [],
    detailStatus: { loading: false, error: null },
    selectedRecord: null,
    createStatus: { loading: false, error: null },
    updateStatus: { loading: false, error: null },
    deactivateStatus: { loading: false, error: null }
};

const medicalRecordSlice = createSlice({
    name: "medicalRecord",
    initialState,
    reducers: {
        // 진료기록 목록 조회
        fetchRecordListRequest: (state, _action: PayloadAction<MedicalRecordSearchParams>) => {
            state.listStatus.loading = true;
            state.listStatus.error = null;
        },
        fetchRecordListSuccess: (state, action: PayloadAction<MedicalRecordDto[]>) => {
            state.listStatus.loading = false;
            state.list = action.payload;
        },
        fetchRecordListFailure: (state, action: PayloadAction<string>) => {
            state.listStatus.loading = false;
            state.listStatus.error = action.payload;
        },

        // 진료기록 상세 조회
        fetchRecordDetailRequest: (state, _action: PayloadAction<string>) => { // recordId
            state.detailStatus.loading = true;
            state.detailStatus.error = null;
        },
        fetchRecordDetailSuccess: (state, action: PayloadAction<MedicalRecordDto>) => {
            state.detailStatus.loading = false;
            state.selectedRecord = action.payload;
        },
        fetchRecordDetailFailure: (state, action: PayloadAction<string>) => {
            state.detailStatus.loading = false;
            state.detailStatus.error = action.payload;
        },

        // 선택된 상세 데이터 초기화
        clearSelectedRecord: (state) => {
            state.selectedRecord = null;
            state.detailStatus = { loading: false, error: null };
        },

        // 진료기록 등록
        createRecordRequest: (state, _action: PayloadAction<MedicalRecordCreateParams>) => {
            state.createStatus.loading = true;
            state.createStatus.error = null;
        },
        createRecordSuccess: (state, action: PayloadAction<MedicalRecordDto>) => {
            state.createStatus.loading = false;
            state.list = [action.payload, ...state.list];
        },
        createRecordFailure: (state, action: PayloadAction<string>) => {
            state.createStatus.loading = false;
            state.createStatus.error = action.payload;
        },

        // 진료기록 수정
        updateRecordRequest: (
            state,
            _action: PayloadAction<{ recordId: string; params: MedicalRecordUpdateParams }>
        ) => {
            state.updateStatus.loading = true;
            state.updateStatus.error = null;
        },
        updateRecordSuccess: (state, action: PayloadAction<MedicalRecordDto>) => {
            state.updateStatus.loading = false;
            state.selectedRecord = action.payload;
            state.list = state.list.map((r) =>
                r.recordId === action.payload.recordId ? action.payload : r
            );
        },
        updateRecordFailure: (state, action: PayloadAction<string>) => {
            state.updateStatus.loading = false;
            state.updateStatus.error = action.payload;
        },

        // 진료기록 비활성화
        deactivateRecordRequest: (
            state,
            _action: PayloadAction<{ recordId: string; userId: string }>
        ) => {
            state.deactivateStatus.loading = true;
            state.deactivateStatus.error = null;
        },
        deactivateRecordSuccess: (state, action: PayloadAction<string>) => { // action.payload = recordId
            state.deactivateStatus.loading = false;
            state.list = state.list.filter((r) => r.recordId !== action.payload);
            if (state.selectedRecord?.recordId === action.payload) {
                state.selectedRecord = null;
            }
        },
        deactivateRecordFailure: (state, action: PayloadAction<string>) => {
            state.deactivateStatus.loading = false;
            state.deactivateStatus.error = action.payload;
        }
    }
});

export const {
    fetchRecordListRequest,
    fetchRecordListSuccess,
    fetchRecordListFailure,
    fetchRecordDetailRequest,
    fetchRecordDetailSuccess,
    fetchRecordDetailFailure,
    clearSelectedRecord,
    createRecordRequest,
    createRecordSuccess,
    createRecordFailure,
    updateRecordRequest,
    updateRecordSuccess,
    updateRecordFailure,
    deactivateRecordRequest,
    deactivateRecordSuccess,
    deactivateRecordFailure
} = medicalRecordSlice.actions;

export default medicalRecordSlice.reducer;