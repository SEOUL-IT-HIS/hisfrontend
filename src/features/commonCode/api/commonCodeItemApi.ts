import apiClient from "@/lib/axios";
import type {
  ApiResponse,
  CommonCodeItem,
  CommonCodeItemApiResponse,
  CommonCodeItemRegisterRequest,
} from "../types/commonCodeItemTypes";

/** GET /api/commonCodeItem/list */
export async function fetchCommonCodeItemApi(groupId: number): Promise<CommonCodeItem[]> {
  const response = await apiClient.get<CommonCodeItemApiResponse>(
    "/api/commonCodeItem/list",
    { params: { groupId } },
  );
  return response.data.data ?? [];
}

/** POST /api/commonCodeItem/register */
export async function fetchCommonCodeItemRegisterApi(
  commonCodeItemData: CommonCodeItemRegisterRequest,
): Promise<CommonCodeItem> {
  const response = await apiClient.post<ApiResponse<CommonCodeItem>>(
    "/api/commonCodeItem/register",
    commonCodeItemData,
  );
  return response.data.data;
}