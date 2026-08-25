import apiClient from "@/lib/axios";
import type { ApiResponse, BedReservationDTO } from "../types";
import type { RegisterBedReservationRequest, UpdateBedReservationRequest } from "../types";

export async function fetchBedReservationApi() {
  const { data } = await apiClient.get<ApiResponse<BedReservationDTO[]>>("/api/inpatient/bedreservation");

  return data.data;
}

export const fetchBedReservationDetailApi = async (id: string) => {
  const { data } = await apiClient.get<ApiResponse<BedReservationDTO>>(`/api/inpatient/bedreservation/${id}`);

  return data.data;
};

export const createBedReservationApi = async (request: RegisterBedReservationRequest) => {
  const { data } = await apiClient.post<ApiResponse<BedReservationDTO>>("/api/inpatient/bedreservation", request);
  return data.data;
};

export const updateBedReservationApi = async (request: UpdateBedReservationRequest) => {
  const { data } = await apiClient.put<ApiResponse<BedReservationDTO>>(`/api/inpatient/bedreservation/${request.bedReservationId}`, request);
  return data.data;
};

export const updateBedReservationScheduleApi = async (id: string, request: { reserveAt: string; expectedAdmissionAt: string }) => {
  const { data } = await apiClient.patch<ApiResponse<BedReservationDTO>>(`/api/inpatient/bedreservation/${id}`, request);
  return data.data;
}

export const deleteBedReservationApi = async (id: string) => {
  const { data } = await apiClient.delete<ApiResponse<void>>(`/api/inpatient/bedreservation/${id}`);
  return data.data;
};