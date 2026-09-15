import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PrescriptionDto, PrescriptionSearchParams } from "./types";

interface PrescriptionState {
    // 목록 조회 상태
    listStatus: { loading: boolean; error: string | null };
    list: PrescriptionDto[];

    // 상세 조회 상태
    detailStatus: { loading: boolean; error: string | null };
    selectedPrescription: PrescriptionDto | null;

    // 비활성화 상태
    deactivateStatus: { loading: boolean; error: string | null };
}

const initialState: PrescriptionState = {
    listStatus: { loading: false, error: null },
    list: [],
    detailStatus: { loading: false, error: null },
    selectedPrescription: null,
    deactivateStatus: { loading: false, error: null },
};

const prescriptionSlice = createSlice({
    name: "prescription",
    initialState,
    reducers: {
        // 처방 목록 조회
        fetchPrescriptionListRequest: (state, _action: PayloadAction<PrescriptionSearchParams | undefined>) => {
            state.listStatus.loading = true;
            state.listStatus.error = null;
        },
        fetchPrescriptionListSuccess: (state, action: PayloadAction<PrescriptionDto[]>) => {
            state.listStatus.loading = false;
            state.list = action.payload;
        },
        fetchPrescriptionListFailure: (state, action: PayloadAction<string>) => {
            state.listStatus.loading = false;
            state.listStatus.error = action.payload;
        },

        // 처방 상세 조회
        fetchPrescriptionDetailRequest: (state, _action: PayloadAction<string>) => { // prescriptionId
            state.detailStatus.loading = true;
            state.detailStatus.error = null;
        },
        fetchPrescriptionDetailSuccess: (state, action: PayloadAction<PrescriptionDto>) => {
            state.detailStatus.loading = false;
            state.selectedPrescription = action.payload; // selectedRecord -> selectedPrescription으로 수정
        },
        fetchPrescriptionDetailFailure: (state, action: PayloadAction<string>) => {
            state.detailStatus.loading = false;
            state.detailStatus.error = action.payload;
        },

        // 선택된 상세 데이터 초기화
        clearSelectedPrescription: (state) => {
            state.selectedPrescription = null;
            state.detailStatus = { loading: false, error: null };
        },

        // 처방 비활성화
        deactivatePrescriptionRequest: (state, _action: PayloadAction<{ prescriptionId: string; cancelReason: string; userId: string }>) => {
            state.deactivateStatus.loading = true;
            state.deactivateStatus.error = null;
        },
        deactivatePrescriptionSuccess: (state, action: PayloadAction<{ prescriptionId: string; cancelReason: string }>) => {
            state.deactivateStatus.loading = false;
            const patch = (p: PrescriptionDto) =>
                p.prescriptionId === action.payload.prescriptionId
                    ? { ...p, status: "CANCELLED", cancelReason: action.payload.cancelReason }
                    : p;
            state.list = state.list.map(patch);
            if (state.selectedPrescription?.prescriptionId === action.payload.prescriptionId) {
                state.selectedPrescription = patch(state.selectedPrescription);
            }
        },
        deactivatePrescriptionFailure: (state, action: PayloadAction<string>) => {
            state.deactivateStatus.loading = false;
            state.deactivateStatus.error = action.payload;
        },
    }
});

export const {
    fetchPrescriptionListRequest,
    fetchPrescriptionListSuccess,
    fetchPrescriptionListFailure,
    fetchPrescriptionDetailRequest,
    fetchPrescriptionDetailSuccess,
    fetchPrescriptionDetailFailure,
    clearSelectedPrescription,
    deactivatePrescriptionRequest,
    deactivatePrescriptionSuccess,
    deactivatePrescriptionFailure,
} = prescriptionSlice.actions;

export default prescriptionSlice.reducer;