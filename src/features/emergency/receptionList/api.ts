import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/emergency/types";
import type { ReceptionListItem } from "@/features/emergency/receptionList/types";

const RECEPTION_LIST_PATH = "/api/emergency/care/patients";

/** 접수 취소 가능 여부 조회 응답(취소된 접수는 reasonCode 가 ALREADY_CANCELLED) */
export type ReceptionCancellable = { receptionId: string; cancellable: boolean; reasonCode: string; records: string[] };

const RECEPTION_CANCELLABLE_PATH = "/api/emergency/care/reception-intakes/cancellable";

/** 접수가 이미 취소됐는지 확인하는 데 쓴다(선택해 둔 환자가 목록에서 사라졌을 때). */
export async function getReceptionCancellable(receptionId: string): Promise<ReceptionCancellable> {
    const { data } = await apiClient.get<ApiResponse<ReceptionCancellable>>(RECEPTION_CANCELLABLE_PATH, {
        params: { receptionId },
    });
    return data.data;
}

/** status: IN_CARE(진료 중) | DONE(퇴실 처리 완료) | CANCELLED(접수 취소) | 비우면 전체 */
export async function getReceptionList(status?: string): Promise<ReceptionListItem[]> {
    const { data } = await apiClient.get<ApiResponse<ReceptionListItem[]>>(RECEPTION_LIST_PATH, {
        params: status ? { status } : undefined,
    });
    return data.data;
}