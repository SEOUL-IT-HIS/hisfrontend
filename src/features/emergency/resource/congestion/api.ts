import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/emergency/types";
import type { Congestion } from "@/features/emergency/resource/congestion/types";

const CONGESTION_PATH = "/api/emergency/resources/congestion";

/** 구역별·전체 혼잡도 지표를 조회한다. UC-RES-01 */
export async function getCongestion(): Promise<Congestion> {
  const { data } = await apiClient.get<ApiResponse<Congestion>>(CONGESTION_PATH);
  return data.data;
}
