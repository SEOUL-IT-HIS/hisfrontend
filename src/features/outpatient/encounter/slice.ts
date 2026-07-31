// features/outpatient/encounter/slice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { EncounterDto, EncounterSearchParams } from "./types";

interface EncounterState {
    listStatus: { loading: boolean; error: string | null };
    list: EncounterDto[];
}

const initialState: EncounterState = {
    listStatus: { loading: false, error: null },
    list: []
};

const encounterSlice = createSlice({
    name: "encounter",
    initialState,
    reducers: {
        fetchEncounterListRequest: (state, _action: PayloadAction<EncounterSearchParams>) => {
            state.listStatus.loading = true;
            state.listStatus.error = null;
        },
        fetchEncounterListSuccess: (state, action: PayloadAction<EncounterDto[]>) => {
            state.listStatus.loading = false;
            state.list = action.payload;
        },
        fetchEncounterListFailure: (state, action: PayloadAction<string>) => {
            state.listStatus.loading = false;
            state.listStatus.error = action.payload;
        }
    }
});

export const { fetchEncounterListRequest, fetchEncounterListSuccess, fetchEncounterListFailure } = encounterSlice.actions;
export default encounterSlice.reducer;