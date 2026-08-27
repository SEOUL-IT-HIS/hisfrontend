import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { ConsultationSaveRequest, ConsultationSaveResponse } from "./types";

interface ConsultationState {
    saveStatus: { loading: boolean; error: string | null };
    lastResult: ConsultationSaveResponse | null;
}

const initialState: ConsultationState = {
    saveStatus: { loading: false, error: null },
    lastResult: null,
};

const consultationSlice = createSlice({
    name: "consultation",
    initialState,
    reducers: {
        saveConsultationRequest: (
            state,
            _action: PayloadAction<{ encounterId: string; payload: ConsultationSaveRequest }>
        ) => {
            state.saveStatus.loading = true;
            state.saveStatus.error = null;
        },
        saveConsultationSuccess: (state, action: PayloadAction<ConsultationSaveResponse>) => {
            state.saveStatus.loading = false;
            state.lastResult = action.payload;
        },
        saveConsultationFailure: (state, action: PayloadAction<string>) => {
            state.saveStatus.loading = false;
            state.saveStatus.error = action.payload;
        },
    },
});

export const { saveConsultationRequest, saveConsultationSuccess, saveConsultationFailure } =
    consultationSlice.actions;
export default consultationSlice.reducer;
