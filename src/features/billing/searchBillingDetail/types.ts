/** 진료비 상세조회 검색 조건 */
export type BillingDetailSearchCondition = {
  patientName?: string;
};

/** 진료비 상세조회 결과 행 */
export type BillingDetail = {
  billingId: string;
  patientName: string;
  tel: string;
  addr: string;
  itemName: string;
  price: string;
  gender: string;
};
