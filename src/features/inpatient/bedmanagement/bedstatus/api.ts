import apiClient from "@/lib/axios";
import type { ApiResponse, BedDTO } from "../types";
import type { CommonCodeItem } from "@/features/commonCode/types/commonCodeItemTypes";

/** 병동(WARD_CD) 공통코드 목록 — 병동별 병상 필터용 */
export async function fetchWardCodesApi() {
  const { data } = await apiClient.get<ApiResponse<CommonCodeItem[]>>("/api/inpatient/codes/ward");
  return data.data;
}

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

export const updateBedWardApi = async (bedId: string, wardCd: string) => {
  const { data } = await apiClient.patch<ApiResponse<BedDTO>>(
    `/api/inpatient/bed/${bedId}/ward`,
    { wardCd },
  );
  return data.data;
}
