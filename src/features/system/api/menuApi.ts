// ============================================================
// Menu API — features/system/menuApi
// ============================================================

import apiClient from "@/lib/axios";
import type { MenuApiResponse, MenuTreeNode } from "../types/menuTypes";
import { toMenuTree } from "../util/menuTree";

/** GET /api/admin/menu → flat row 조회 후 트리 조합 */
export async function fetchMenuApi(): Promise<MenuTreeNode[]> {
  const response = await apiClient.get<MenuApiResponse>("/api/admin/menu");
  return toMenuTree(response.data.data ?? []);
}
