export interface PatientSearchItem {
  patientId: string;
  patientName: string;
  birthDate: string;
  genderCode: string;
  phoneNumber: string;
}

export interface PatientSearchQuery {
  keyword: string;
}
