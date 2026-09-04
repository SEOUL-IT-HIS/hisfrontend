export interface PatientSearchItem {
  patientId: string;
  patientName: string;
  birthDate: string;
  genderCd: string;
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
