import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/reception/types";
import type { PatientSearchItem, PatientSearchQuery } from "./types";

const PATIENT_SEARCH_PATH = "/api/patient/patients";

export async function searchPatients(
  query: PatientSearchQuery,
): Promise<PatientSearchItem[]> {
  const { data } = await apiClient.get<ApiResponse<PatientSearchItem[]>>(
    PATIENT_SEARCH_PATH,
    { params: query },
  );
  return data.data;
}
