import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/emergency/types";
import type { ReceptionListItem } from "@/features/emergency/receptionList/types";

const RECEPTION_LIST_PATH = "/api/emergency/care/patients";

/** status: IN_CARE(진료 중) | DONE(퇴실 처리 완료) | 비우면 전체 */
export async function getReceptionList(status?: string): Promise<ReceptionListItem[]> {
    const { data } = await apiClient.get<ApiResponse<ReceptionListItem[]>>(RECEPTION_LIST_PATH, {
        params: status ? { status } : undefined,
    });
    return data.data;
}