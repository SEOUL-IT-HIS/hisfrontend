import apiClient from "@/lib/axios";
import type { ApiResponse, BedDTO, WardBedStatusDTO } from "../types";
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

/** 병동별 병상 집계(전체/빈/재원/예약/정비) — 대시보드 탭에서 병동마다 호출 */
export const fetchWardBedStatusApi = async (wardCd: string) => {
  const { data } = await apiClient.get<ApiResponse<WardBedStatusDTO>>("/api/inpatient/bed/dashboard", {
    params: { wardCd },
  });
  return data.data;
};
