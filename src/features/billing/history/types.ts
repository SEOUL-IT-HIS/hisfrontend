// 환자 검색
export type SearchPatient = {
  patientName?: string;
}

// 환자 이름 검색 결과 - 완결된 수납 건 한 행 (BillingHistorySummaryDTO)
export type SearchPatientResult = {
  billingId: string;
  patientId: string;

  patientName: string;
  address: string;
  addressDetail: string;
  phoneNo: string;
  birthDate: string;

  billingType: string;

  paymentId: string;
  paymentAmount: number;
  paymentMethod: string;
  paymentAt: string;
  receiptNo: string;

  billingStatus: string;
}

// 환자별 수납이력 한 건 (BillingHistoryDTO)
export type BillingHistoryItem = {
  billingId: string;
  patientId: string;
  patientName: string;
  billingType: string;

  paymentId: string;
  paymentAmount: number;
  paymentMethod: string;
  paymentAt: string;
  receiptNo: string;

  billingStatus: string;
}
