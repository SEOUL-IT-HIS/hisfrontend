import apiClient from "@/lib/axios";
import type {
  ApiResponse,
  CommonCodeGroup,
  CommonCodeItem,
  CreateCommonCodeGroupRequest,
  CreateCommonCodeRequest,
  UpdateCommonCodeGroupRequest,
  UpdateCommonCodeRequest,
} from "@/features/commoncode/types";

const COMMON_CODE_PATH = "/api/common-codes";
const COMMON_CODE_GROUP_PATH = "/api/common-code-groups";

/**
 * 공통코드 항목 목록
 * GET /api/common-codes?groupCode=&useYn=&keyword=
 */
export async function getCommonCodes(
  groupCode: string,
  useYn?: string,
  keyword?: string,
): Promise<CommonCodeItem[]> {
  const { data } = await apiClient.get<ApiResponse<CommonCodeItem[]>>(
    COMMON_CODE_PATH,
    { params: { groupCode, useYn, keyword } },
  );
  return data.data ?? [];
}

/** GET /api/common-codes/{codeId} */
export async function getCommonCode(codeId: number): Promise<CommonCodeItem> {
  const { data } = await apiClient.get<ApiResponse<CommonCodeItem>>(
    `${COMMON_CODE_PATH}/${codeId}`,
  );
  return data.data;
}

/** POST /api/common-codes */
export async function createCommonCode(
  payload: CreateCommonCodeRequest,
): Promise<CommonCodeItem> {
  const { data } = await apiClient.post<ApiResponse<CommonCodeItem>>(
    COMMON_CODE_PATH,
    payload,
  );
  return data.data;
}

/** PUT /api/common-codes/{codeId} */
export async function updateCommonCode(
  codeId: number,
  payload: UpdateCommonCodeRequest,
): Promise<CommonCodeItem> {
  const { data } = await apiClient.put<ApiResponse<CommonCodeItem>>(
    `${COMMON_CODE_PATH}/${codeId}`,
    payload,
  );
  return data.data;
}

/** DELETE /api/common-codes/{codeId} */
export async function deleteCommonCode(codeId: number): Promise<void> {
  await apiClient.delete(`${COMMON_CODE_PATH}/${codeId}`);
}

/** GET /api/common-code-groups */
export async function getCommonCodeGroups(): Promise<CommonCodeGroup[]> {
  const { data } = await apiClient.get<ApiResponse<CommonCodeGroup[]>>(
    COMMON_CODE_GROUP_PATH,
  );
  return data.data ?? [];
}

/** POST /api/common-code-groups */
export async function createCommonCodeGroup(
  payload: CreateCommonCodeGroupRequest,
): Promise<CommonCodeGroup> {
  const { data } = await apiClient.post<ApiResponse<CommonCodeGroup>>(
    COMMON_CODE_GROUP_PATH,
    payload,
  );
  return data.data;
}

/** PUT /api/common-code-groups/{groupId} */
export async function updateCommonCodeGroup(
  groupId: number,
  payload: UpdateCommonCodeGroupRequest,
): Promise<CommonCodeGroup> {
  const { data } = await apiClient.put<ApiResponse<CommonCodeGroup>>(
    `${COMMON_CODE_GROUP_PATH}/${groupId}`,
    payload,
  );
  return data.data;
}

/** DELETE /api/common-code-groups/{groupId} */
export async function deleteCommonCodeGroup(groupId: number): Promise<void> {
  await apiClient.delete(`${COMMON_CODE_GROUP_PATH}/${groupId}`);
}
