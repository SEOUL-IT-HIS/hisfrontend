/**
 * [공통코드 그룹 API]
 * admin-service REST 호출만 담당 (UI/Redux 모름)
 *
 * - 목록 GET  /api/commonCodeGroup/list
 * - 등록 POST /api/commonCodeGroup/register
 * - 수정 PUT  /api/commonCodeGroup/update/{groupId}
 *
 * 응답은 ApiResponse 래퍼 → data 필드만 반환
 */
import apiClient from "@/lib/axios";
import type {
  CommonCodeGroup,
  CommonCodeGroupApiResponse,
  CommonCodeGroupUpdateRequest,
} from "../types/commonCodeGroupTypes";
import { ApiResponse } from "../types/commonCodeGroupTypes";

/** 그룹 전체 목록 조회 */
export async function fetchCommonCodeGroupApi(): Promise<CommonCodeGroup[]> {
  const response = await apiClient.get<CommonCodeGroupApiResponse>(
    "/api/commonCodeGroup/list",
  );
  return response.data.data ?? [];
}

/** 그룹 등록 — body: groupCode, groupName, useYn */
export async function fetchCommonCodeGroupRegisterApi(
  commonCodeGroupData: Pick<CommonCodeGroup, "groupCode" | "groupName" | "useYn">,
): Promise<CommonCodeGroup> {
  const response = await apiClient.post<ApiResponse<CommonCodeGroup>>(
    "/api/commonCodeGroup/register",
    commonCodeGroupData,
  );
  return response.data.data;
}

/**
 * 그룹 수정
 * - Path: groupId
 * - Body: groupName, useYn 만 (groupCode 는 변경 불가)
 */
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
