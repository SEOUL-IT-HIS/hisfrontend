import apiClient from "@/lib/axios";
import type { ApiResponse, BedDTO } from "./types";
import type { RegisterBedRequest, UpdateBedRequest } from "./types";

export async function fetchBedApi() {
  const { data } = await apiClient.get<ApiResponse<BedDTO[]>>("/api/bed");

  return data.data;
}

export const fetchBedDetailApi = async (bedId: string) => {
  const { data } = await apiClient.get<ApiResponse<BedDTO>>(`/api/bed/${bedId}`);

  return data.data;
};