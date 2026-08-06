/**
 * [공통코드 항목 API]
 * admin-service REST 호출만 담당
 *
 * - 목록 GET  /api/commonCodeItem/list?groupId=
 * - 등록 POST /api/commonCodeItem/register
 * - 수정 PUT  /api/commonCodeItem/update/{codeId}
 */
import apiClient from "@/lib/axios";
import { fetchCommonCodeGroupApi } from "./commonCodeGroupApi";
import type {
  ApiResponse,
  CommonCodeItem,
  CommonCodeItemApiResponse,
  CommonCodeItemRegisterRequest,
  CommonCodeItemUpdateRequest,
} from "../types/commonCodeItemTypes";

/** 그룹별 항목 목록 — groupId 필수 */
export async function fetchCommonCodeItemApi(groupId: number): Promise<CommonCodeItem[]> {
  const response = await apiClient.get<CommonCodeItemApiResponse>(
    "/api/commonCodeItem/list",
    { params: { groupId } },
  );
  return response.data.data ?? [];
}

/**
 * 그룹코드(예: DEPT_CD)로 항목 목록 조회
 * 1) 그룹 목록에서 groupCode 찾기
 * 2) 해당 groupId 로 항목 조회
 * 3) 사용중(Y) 만 반환
 */
export async function fetchCommonCodeItemsByGroupCode(
  groupCode: string,
): Promise<CommonCodeItem[]> {
  const groups = await fetchCommonCodeGroupApi();
  const group = groups.find((g) => g.groupCode === groupCode);
  if (!group) return [];
  const items = await fetchCommonCodeItemApi(group.groupId);
  return items.filter((item) => item.useYn === "Y");
}

/** 항목 등록 — body: groupId, codeValue, codeName, useYn */
export async function fetchCommonCodeItemRegisterApi(
  commonCodeItemData: CommonCodeItemRegisterRequest,
): Promise<CommonCodeItem> {
  const response = await apiClient.post<ApiResponse<CommonCodeItem>>(
    "/api/commonCodeItem/register",
    commonCodeItemData,
  );
  return response.data.data;
}

/**
 * 항목 수정
 * - Path: codeId
 * - Body: codeName, useYn 만 (codeValue 는 변경 불가)
 */
export async function fetchCommonCodeItemUpdateApi(
  commonCodeItemData: CommonCodeItemUpdateRequest,
): Promise<CommonCodeItem> {
  const { codeId, codeName, useYn } = commonCodeItemData;
  const response = await apiClient.put<ApiResponse<CommonCodeItem>>(
    `/api/commonCodeItem/update/${codeId}`,
    { codeName, useYn },
  );
  return response.data.data;
}
