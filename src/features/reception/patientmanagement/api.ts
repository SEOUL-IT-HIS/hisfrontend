import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/features/reception/types";
import type { PatientBatchItem, PatientSearchItem, PatientSearchQuery } from "./types";

const PATIENT_SEARCH_PATH = "/api/patient/list";
const PATIENT_BATCH_PATH = "/api/patient/batch";
const ACTIVE_STATUS = "ACTIVE";

/**
 * 접수용 환자 검색 — 환자관리에서 비활성화(INACTIVE)된 환자는 접수 대상이 아니므로 제외한다.
 * - patient-service 에 statusCd=ACTIVE 로 요청하고, 응답에서도 한 번 더 걸러낸다.
 */
export async function searchPatients(
  query: PatientSearchQuery,
): Promise<PatientSearchItem[]> {
  const { data } = await apiClient.get<ApiResponse<PatientSearchItem[]>>(
    PATIENT_SEARCH_PATH,
    {
      params: {
        patientName: query.patientName || undefined,
        statusCd: ACTIVE_STATUS,
      },
    },
  );
  return data.data.filter(
    (patient) => !patient.statusCd || patient.statusCd === ACTIVE_STATUS,
  );
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
