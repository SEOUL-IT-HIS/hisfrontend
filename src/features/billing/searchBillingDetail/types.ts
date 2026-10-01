/** 환자이름 검색 */
export type SearchPatient = {
  patientName?: string;
}
/** 환자 검색후 리스트 정보  */
export type SearchPatientResult = {
  patientId: string;
  patientName: string;
  address: string;
  phoneNo: string;
  birthDate: string;

  billingId: string;
  billingStatus: string;
  billingType: string;   // OUTPATIENT / INPATIENT
  totalAmount: number;   // 결제 대기 항목 합계
  createdAt: string;     // billing 생성일시 (yyyy-MM-dd HH:mm)
}
/** 진료비 상세조회 결과의 상세 항목(수납상세) 1행 */
export type BillingDetailItem = {
  billingType: string;
  quantity: string;
  unitPrice: string;
  amount: string;
  detailStatus: string;
  occurredAt: string;

  feeCode: string;
  itemName: string;
}

/** 진료비 상세조회 결과 행 */
export type BillingDetail = {
  billingId: string;
  visitId: string;
  admissionId: string;
  billingStatus: string;

  outpatientAmount: number;
  inpatientAmount: number;
  totalAmount: number;

  patientId: string;
  patientName: string;
  phoneNo: string;
  address: string;
  birthDate: string;

  items: BillingDetailItem[];
}

/** 진료비 입원 상세조회 */
export type BillingDetailAdmission = {
  billingId: string;
  patientId: string;
  visitId: string;
  admissionId: string;
  billingStatus: string;

  billingDetailId: string;
  billingMasterId: string;
  sourceServiceCode: string;
  sourceRecordId: string;
  quantity: string;
  unitPrice: string;
  amount: string;
  detailStatus: string;
  OccurredAt: string;
  createdAt: string;
  updatedAt: string;
  
  feeCode: string;
  itemName: string;
}
/** 진료비 방문 상세조회 */
export type BillingDetailVisit = {
  billingId: string;
  patientId: string;
  visitId: string;
  admissionId: string;
  billingStatus: string;

  billingDetailId: string;
  billingMasterId: string;
  sourceServiceCode: string;
  sourceRecordId: string;
  quantity: string;
  unitPrice: string;
  amount: string;
  detailStatus: string;
  OccurredAt: string;
  createdAt: string;
  updatedAt: string;
  
  feeCode: string;
  itemName: string;
 
}