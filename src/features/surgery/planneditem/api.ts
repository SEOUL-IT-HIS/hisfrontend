import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/surgery/types";
import type {
  CreateSurgeryPlannedItemRequest,
  SurgeryPlannedItem,
} from "@/features/surgery/planneditem/types";

const SURGERY_PATH = "/api/surgery";

export async function getSurgeryPlannedItems(
  surgeryId: string,
): Promise<SurgeryPlannedItem[]> {
  const { data } = await apiClient.get<ApiResponse<SurgeryPlannedItem[]>>(
    `${SURGERY_PATH}/${encodeURIComponent(surgeryId)}/planned-items`,
  );
  return data.data ?? [];
}

export async function createSurgeryPlannedItem(
  surgeryId: string,
  request: CreateSurgeryPlannedItemRequest,
): Promise<SurgeryPlannedItem> {
  const { data } = await apiClient.post<ApiResponse<SurgeryPlannedItem>>(
    `${SURGERY_PATH}/${encodeURIComponent(surgeryId)}/planned-items`,
    request,
  );
  return data.data;
}

export async function deleteSurgeryPlannedItem(
  plannedItemId: string,
): Promise<void> {
  await apiClient.delete<ApiResponse<null>>(
    `${SURGERY_PATH}/planned-items/${encodeURIComponent(plannedItemId)}`,
  );
}
