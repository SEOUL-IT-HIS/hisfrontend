import apiClient from "@/lib/axios";
import type {
    CommonCodeItem,
    CommonCodeItemApiResponse,
} from "../types/commonCodeItemTypes";
import {ApiResponse} from "@/features/commonCode/types/commonCodeGroupTypes";

/** GET /api/commonCodeGroup/list */
export async function fetchCommonCodeItemApi(groupId: number): Promise<CommonCodeItem[]> {
    const response = await apiClient.get<CommonCodeItemApiResponse>(
        "/api/commonCodeItem/list",
        { params: { groupId } }
    );
    return response.data.data ?? [];
}

export async function fetchCommonCodeItemRegisterApi(
    commonCodeItemData: Pick<CommonCodeItem, "groupId" | "codeName" | "useYn">,
): Promise<CommonCodeItem> {
    const response = await apiClient.post<ApiResponse<CommonCodeItem>>(
        "/api/commonCodeItem/register",
        commonCodeItemData,
    );
    return response.data.data;
}