import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/emergency/types";
import type { CommonCodeByGroup } from "@/features/emergency/commonCode/types";

const COMMON_CODE_PATH = "/api/emergency/codes/common";

/**
 * emergency-service 가 서버 기동 시 admin-service 에서 미리 캐싱해둔 공통코드 "전체"를
 * 한 번에 받아온다 (팀 합의: 그룹별로 나눠 받지 않고 한 번에 전부 받는 단순한 방식).
 * admin 을 직접 호출하는 게 아니라 emergency-service 의 캐시를 호출하는 것.
 */
export async function getAllCommonCodes(): Promise<CommonCodeByGroup> {
  const { data } = await apiClient.get<ApiResponse<CommonCodeByGroup>>(COMMON_CODE_PATH);
  return data.data;
}
