import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/admin/types";
import type { MenuItem } from "@/features/system/types";

const MENU_PATH = "/api/menus";

/**
 * 메뉴 목록 조회 (flat)
 * GET /api/menus
 * - USE_YN = Y 만 서버에서 필터
 * - 트리 조립은 buildMenuTree 에서 수행
 */
export async function getMenus(): Promise<MenuItem[]> {
  const { data } = await apiClient.get<ApiResponse<MenuItem[]>>(MENU_PATH);
  return data.data ?? [];
}
