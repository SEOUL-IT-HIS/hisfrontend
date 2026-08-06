import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MedicalRecordDto, MedicalRecordSearchParams } from "./types";

interface MedicalRecordState {
    // 목록 조회 상태
    listStatus: { loading: boolean; error: string | null };
    list: MedicalRecordDto[];

    // 상세 조회 상태
    detailStatus: { loading: boolean; error: string | null };
    selectedRecord: MedicalRecordDto | null;
}

const initialState: MedicalRecordState = {
    listStatus: { loading: false, error: null },
    list: [],
    detailStatus: { loading: false, error: null },
    selectedRecord: null
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
    clearSelectedRecord
} = medicalRecordSlice.actions;

export default medicalRecordSlice.reducer;