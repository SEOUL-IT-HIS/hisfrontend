import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { BillingDetail, BillingDetailSearchCondition } from "./types";

interface BillingDetailState {
    billingDetails: BillingDetail[];
    loading: boolean;
    error: string | null;
}

const initialState: BillingDetailState = {
    billingDetails: [],
    loading: false,
    error: null
}

const billingDetailSlice = createSlice({
    name: "billingDetail",
    initialState,
    reducers: {
        searchBillingDetailRequest: (
            state, _action: PayloadAction<BillingDetailSearchCondition>) => {
            state.loading = true;
            state.error = null;
        },

        searchBillingDetailSuccess: (
            state, action: PayloadAction<BillingDetail[]>) => {
            state.loading = false;
            state.billingDetails = action.payload;
        },

        searchBillingDetailFailure: (
            state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        }
    }
});

export const {
    searchBillingDetailRequest,
    searchBillingDetailSuccess,
    searchBillingDetailFailure
} = billingDetailSlice.actions;

export default billingDetailSlice.reducer;
