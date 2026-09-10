import apiClient from "@/lib/axios";
import type {
  PatientSafetyInfo,
  SafetyListRequest,
  SafetyCreateRequest,
  SafetyUpdateRequest,
  SafetyItemRequest,
} from "../type/patientSafetyType";

type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

const baseUrl = (patientId: string) =>
  `/api/patient/${encodeURIComponent(patientId)}/safety-info`;

const itemUrl = ({ patientId, safetyInfoId }: SafetyItemRequest) =>
  `${baseUrl(patientId)}/${encodeURIComponent(safetyInfoId)}`;

export async function setSafetyPinnedApi(request: SafetyItemRequest & { pinned: boolean }): Promise<PatientSafetyInfo> {
  const response = await apiClient.patch<ApiResponse<PatientSafetyInfo>>(`${itemUrl(request)}/pin`, { pinned: request.pinned });
  return response.data.data;
}

// 목록 조회
export async function fetchSafetyListApi({
  patientId,
  includeInactive,
}: SafetyListRequest): Promise<PatientSafetyInfo[]> {
  const response = await apiClient.get<ApiResponse<PatientSafetyInfo[]>>(
    baseUrl(patientId),
    { params: { includeInactive } },
  );

  return response.data.data;
}

// 상세 조회
export async function fetchSafetyDetailApi(
  request: SafetyItemRequest,
): Promise<PatientSafetyInfo> {
  const response = await apiClient.get<ApiResponse<PatientSafetyInfo>>(
    itemUrl(request),
  );

  return response.data.data;
}

// 등록
export async function createSafetyApi({
  patientId,
  safetyNote,
}: SafetyCreateRequest): Promise<PatientSafetyInfo> {
  const response = await apiClient.post<ApiResponse<PatientSafetyInfo>>(
    baseUrl(patientId),
    { safetyNote },
  );

  return response.data.data;
}

// 수정
export async function updateSafetyApi(
  request: SafetyUpdateRequest,
): Promise<PatientSafetyInfo> {
  const response = await apiClient.patch<ApiResponse<PatientSafetyInfo>>(
    itemUrl(request),
    { safetyNote: request.safetyNote },
  );

  return response.data.data;
}

// 비활성화
export async function deactivateSafetyApi(
  request: SafetyItemRequest,
): Promise<PatientSafetyInfo> {
  const response = await apiClient.patch<ApiResponse<PatientSafetyInfo>>(
    `${itemUrl(request)}/deactivate`,
  );

  return response.data.data;
}
