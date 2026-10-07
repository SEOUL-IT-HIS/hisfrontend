/** Billing master */
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

/** Billing master create request */
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

/** Billing master update request - only these fields are editable */
export type BillingMasterUpdateRequest = {
  feeName: string;
  defaultPrice: string;
  effectiveFrom: string;
  effectiveTo: string;
  useYn: string;
};
