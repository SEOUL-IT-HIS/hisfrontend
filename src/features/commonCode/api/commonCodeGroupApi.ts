import apiClient from "@/lib/axios";
import type {
  CommonCodeGroup,
  CommonCodeGroupApiResponse,
  CommonCodeGroupUpdateRequest,
} from "../types/commonCodeGroupTypes";
import { ApiResponse } from "../types/commonCodeGroupTypes";

/** GET /api/commonCodeGroup/list */
export async function fetchCommonCodeGroupApi(): Promise<CommonCodeGroup[]> {
  const response = await apiClient.get<CommonCodeGroupApiResponse>(
    "/api/commonCodeGroup/list",
  );
  return response.data.data ?? [];
}

export async function fetchCommonCodeGroupRegisterApi(
  commonCodeGroupData: Pick<CommonCodeGroup, "groupCode" | "groupName" | "useYn">,
): Promise<CommonCodeGroup> {
  const response = await apiClient.post<ApiResponse<CommonCodeGroup>>(
    "/api/commonCodeGroup/register",
    commonCodeGroupData,
  );
  return response.data.data;
}

/** PUT /api/commonCodeGroup/update/{groupId} */
export async function fetchCommonCodeGroupUpdateApi(
  commonCodeGroupData: CommonCodeGroupUpdateRequest,
): Promise<CommonCodeGroup> {
  const { groupId, groupName, useYn } = commonCodeGroupData;
  const response = await apiClient.put<ApiResponse<CommonCodeGroup>>(
    `/api/commonCodeGroup/update/${groupId}`,
    { groupName, useYn },
  );
  return response.data.data;
}
