export interface PatientSearchItem {
  patientId: string;
  patientName: string;
  birthDate: string;
  genderCd: string;
  /** ACTIVE / INACTIVE — 검색 응답에만 있고, 신규등록 직후 선택 등에서는 없을 수 있다 */
  statusCd?: string;
}

/** POST /api/patient/batch 응답 항목 */
export interface PatientBatchItem {
  patientId: string;
  patientName: string;
  birthDate: string;
  genderCd: string;
  statusCd: string;
}

export interface PatientSearchQuery {
  patientName: string;
}
