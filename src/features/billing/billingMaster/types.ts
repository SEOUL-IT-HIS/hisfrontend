/** 수납 기준정보 */
export type BillingMaster = {
  billingMasterId: string;
  sourceServiceCode: string;
  feeCode: string;
  feeName: string;
  defaultPrice: string;
  categoryCode: string;
  insuranceTypeCode: string;
  effectiveFrom: string;
  effectiveTo: string;
  useYn: string;
};

/** 수납 기준정보 등록 요청 */
export type BillingMasterCreateRequest = {
  sourceServiceCode: string;
  feeCode: string;
  feeName: string;
  defaultPrice: string;
  categoryCode: string;
  insuranceTypeCode: string;
  effectiveFrom: string;
  effectiveTo: string;
};
