// ============================================================
// Menu API — features/system/menuApi
// ============================================================

import apiClient from "@/lib/axios";
import type { MenuApiResponse, MenuTreeNode } from "../types/menuTypes";
import { toMenuTree } from "../util/menuTree";

/** GET /api/menu → flat row 조회 후 트리 조합 */
export async function fetchMenuApi(): Promise<MenuTreeNode[]> {
  const response = await apiClient.get<MenuApiResponse>("/api/menu");
  return toMenuTree(response.data.data ?? []);
}
