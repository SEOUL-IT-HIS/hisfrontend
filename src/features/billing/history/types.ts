// 환자 검색
export type SearchPatient = {
  patientName?: string;
}

// 환자 이름 검색 결과 - 완결된 수납 건 한 행 (BillingHistorySummaryDTO)
// 한 환자가 여러 건일 수 있으므로 행 구분은 billingId 기준
export type SearchPatientResult = {
  billingId: string;
  patientId: string;

  patientName: string;
  address: string;
  phoneNo: string;
  birthDate: string;

  billingType: string;
  paymentAmount: number;
  paymentMethod: string;
  paymentAt: string;
  receiptNo: string;
}

// 수납이력 상세보기 - 진료 항목 1행 (BillingDetailItemDTO)
export type BillingHistoryDetailItem = {
  billingType: string;
  quantity: string;
  unitPrice: string;
  amount: string;
  occurredAt: string;

  feeCode: string;
  itemName: string;
}

// 수납이력 상세보기 - 결제 완료 billing 한 건 (BillingHistoryDetailDTO)
export type BillingHistoryDetail = {
  billingId: string;
  billingType: string;
  billingStatus: string;

  patientId: string;
  patientName: string;
  phoneNo: string;
  birthDate: string;

  paymentId: string;
  paymentAmount: number;
  paymentMethod: string;
  paymentAt: string;
  receiptNo: string;

  items: BillingHistoryDetailItem[];
}
