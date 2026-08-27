import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/emergency/types";
import type { ReceptionListItem } from "@/features/emergency/receptionList/types";

const RECEPTION_LIST_PATH = "/api/emergency/care/patients";

export async function getReceptionList(): Promise<ReceptionListItem[]> {
    const { data } = await apiClient.get<ApiResponse<ReceptionListItem[]>>(RECEPTION_LIST_PATH);
    return data.data;
}