import apiClient from "@/lib/axios";
import type { ApiResponse, BedAssignmentDTO } from "./types";
import type { RegisterBedAssignmentRequest, UpdateBedAssignmentRequest } from "./types";

export async function fetchBedAssignmentApi() {
  const { data } = await apiClient.get<ApiResponse<BedAssignmentDTO[]>>("/api/bedassignment");

  return data.data;
}

export const fetchBedAssignmentDetailApi = async (id: string) => {
  const { data } = await apiClient.get<ApiResponse<BedAssignmentDTO>>(`/api/bedassignment/${id}`);

  return data.data;
};

export const createBedAssignmentApi = async (request: RegisterBedAssignmentRequest) => {
  const { data } = await apiClient.post<ApiResponse<BedAssignmentDTO>>("/api/bedassignment", request);
  return data.data;
};

export const updateBedAssignmentApi = async (request: UpdateBedAssignmentRequest) => {
  const { data } = await apiClient.put<ApiResponse<BedAssignmentDTO>>(`/api/bedassignment/${request.assignmentId}`, request);
  return data.data;
};

export const deleteBedAssignmentApi = async (id: string) => {
  const { data } = await apiClient.delete<ApiResponse<void>>(`/api/bedassignment/${id}`);
  return data.data;
};