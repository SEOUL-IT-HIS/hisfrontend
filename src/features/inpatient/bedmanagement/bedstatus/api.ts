import apiClient from "@/lib/axios";
import type { ApiResponse, BedDTO } from "../types";

export async function fetchBedApi() {
  const { data } = await apiClient.get<ApiResponse<BedDTO[]>>("/api/inpatient/bed");

  return data.data;
}

export const fetchBedDetailApi = async (bedId: string) => {
  const { data } = await apiClient.get<ApiResponse<BedDTO>>(`/api/inpatient/bed/${bedId}`);

  return data.data;
};

export const updateBedRoomTypeApi = async (bedId: string, roomTypeCode: string) => {
  const { data } = await apiClient.patch<ApiResponse<BedDTO>>(
    `/api/inpatient/bed/${bedId}/room-type`,
    { roomTypeCode },
  );
  return data.data;
};
