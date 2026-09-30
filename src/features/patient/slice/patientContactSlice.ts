import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";
import type {
    PatientContact,
    PatientContactCreateRequest,
    PatientContactItemRequest,
    PatientContactListRequest,
    PatientContactUpdateRequest,
} from "../type/patientContactType";

export type PatientContactMutation =
    | ({ kind: "create" } & PatientContactCreateRequest)
    | ({ kind: "update" } & PatientContactUpdateRequest)
    | ({ kind: "setPrimary" } & PatientContactItemRequest)
    | ({ kind: "deactivate" } & PatientContactItemRequest);

type PatientContactListSuccess = PatientContactListRequest & {
    items: PatientContact[];
};

type PatientContactListFailure = PatientContactListRequest & {
    message: string;
};

type PatientContactState = {
    patientId: string | null;
    items: PatientContact[];
    includeInactive: boolean;
    listLoading: boolean;
    listError: string | null;
    mutationId: string | null;
    mutationLoading: boolean;
    mutationError: string | null;
    mutationSuccess: boolean;
};

const initialState: PatientContactState = {
    patientId: null,
    items: [],
    includeInactive: false,
    listLoading: false,
    listError: null,
    mutationId: null,
    mutationLoading: false,
    mutationError: null,
    mutationSuccess: false,
};

const patientContactSlice = createSlice({
    name: "patientContact",
    initialState,
    reducers: {
        mutatePatientContactRequest: {
            prepare(request: PatientContactMutation) {
                return { payload: { ...request, requestId: nanoid() } };
            },
            reducer(
                state,
                action: PayloadAction<PatientContactMutation & { requestId: string }>,
            ) {
                if (
                    state.mutationLoading ||
                    state.patientId !== action.payload.patientId
                ) {
                    return;
                }

                state.mutationId = action.payload.requestId;
                state.mutationLoading = true;
                state.mutationError = null;
                state.mutationSuccess = false;
            },
        },

        mutatePatientContactSuccess(
            state,
            action: PayloadAction<{ requestId: string }>,
        ) {
            if (state.mutationId !== action.payload.requestId) return;

            state.mutationLoading = false;
            state.mutationSuccess = true;
        },

        mutatePatientContactFailure(
            state,
            action: PayloadAction<{ requestId: string; message: string }>,
        ) {
            if (state.mutationId !== action.payload.requestId) return;

            state.mutationLoading = false;
            state.mutationError = action.payload.message;
        },

        resetPatientContactMutation(state) {
            if (state.mutationLoading) return;

            state.mutationId = null;
            state.mutationError = null;
            state.mutationSuccess = false;
        },

        fetchPatientContactListRequest(
            state,
            action: PayloadAction<PatientContactListRequest>,
        ) {
            const { patientId, includeInactive = false } = action.payload;

            if (
                state.patientId !== patientId ||
                state.includeInactive !== includeInactive
            ) {
                state.items = [];
            }

            state.patientId = patientId;
            state.includeInactive = includeInactive;
            state.listLoading = true;
            state.listError = null;
        },

        fetchPatientContactListSuccess(
            state,
            action: PayloadAction<PatientContactListSuccess>,
        ) {
            const { patientId, includeInactive = false, items } = action.payload;

            if (
                state.patientId !== patientId ||
                state.includeInactive !== includeInactive
            ) {
                return;
            }

            state.items = items;
            state.listLoading = false;
            state.listError = null;
        },

        fetchPatientContactListFailure(
            state,
            action: PayloadAction<PatientContactListFailure>,
        ) {
            const { patientId, includeInactive = false, message } = action.payload;

            if (
                state.patientId !== patientId ||
                state.includeInactive !== includeInactive
            ) {
                return;
            }

            state.listLoading = false;
            state.listError = message;
        },

        resetPatientContact() {
            return initialState;
        },
    },
});

export const {
    mutatePatientContactRequest,
    mutatePatientContactSuccess,
    mutatePatientContactFailure,
    resetPatientContactMutation,
    fetchPatientContactListRequest,
    fetchPatientContactListSuccess,
    fetchPatientContactListFailure,
    resetPatientContact,
} = patientContactSlice.actions;

export default patientContactSlice.reducer;