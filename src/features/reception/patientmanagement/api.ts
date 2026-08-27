import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/reception/types";
import type { PatientBatchItem, PatientSearchItem, PatientSearchQuery } from "./types";

const PATIENT_SEARCH_PATH = "/api/patient/list";
const PATIENT_BATCH_PATH = "/api/patient/batch";

export async function searchPatients(
  query: PatientSearchQuery,
): Promise<PatientSearchItem[]> {
  const { data } = await apiClient.get<ApiResponse<PatientSearchItem[]>>(
    PATIENT_SEARCH_PATH,
    { params: { patientName: query.patientName || undefined } },
  );
  return data.data;
}

/** 환자ID 목록으로 환자명 등을 한 번에 조회 (접수 목록/상세 화면에서 이름 표시용) */
export async function fetchPatientsByIds(
  patientIds: string[],
): Promise<PatientBatchItem[]> {
  if (patientIds.length === 0) return [];
  const { data } = await apiClient.post<ApiResponse<PatientBatchItem[]>>(
    PATIENT_BATCH_PATH,
    { patientIds },
  );
  return data.data;
}
