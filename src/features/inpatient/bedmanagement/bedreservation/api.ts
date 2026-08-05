import apiClient from "@/lib/axios";
import type { ApiResponse, BedReservationDTO } from "../types";
import type { RegisterBedReservationRequest, UpdateBedReservationRequest } from "../types";

export async function fetchBedReservationApi() {
  const { data } = await apiClient.get<ApiResponse<BedReservationDTO[]>>("/api/bedreservation");

  return data.data;
}

export const fetchBedReservationDetailApi = async (id: string) => {
  const { data } = await apiClient.get<ApiResponse<BedReservationDTO>>(`/api/bedreservation/${id}`);

  return data.data;
};

export const createBedReservationApi = async (request: RegisterBedReservationRequest) => {
  const { data } = await apiClient.post<ApiResponse<BedReservationDTO>>("/api/bedreservation", request);
  return data.data;
};

export const updateBedReservationApi = async (request: UpdateBedReservationRequest) => {
  const { data } = await apiClient.put<ApiResponse<BedReservationDTO>>(`/api/bedreservation/${request.bedReservationId}`, request);
  return data.data;
};

export const deleteBedReservationApi = async (id: string) => {
  const { data } = await apiClient.delete<ApiResponse<void>>(`/api/bedreservation/${id}`);
  return data.data;
};