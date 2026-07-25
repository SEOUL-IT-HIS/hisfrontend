import axios from "axios";
import type { BillingDetailSearchCondition } from "./types";

export const searchBillingDetailsApi = (
    condition: BillingDetailSearchCondition
) => {
    return axios.get("/api/billing/detail", {
        params: condition
    });
};