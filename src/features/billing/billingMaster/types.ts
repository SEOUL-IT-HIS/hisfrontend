export interface BillingMaster{
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
}
export interface BillingMasterCreateRequest{
    sourceServiceCode: string;
    feeCode: string;
    feeName: string;
    defaultPrice: string;
    categoryCode: string;
    insuranceTypeCode: string;
    effectiveFrom:string;
    effectiveTo:string;
}
export interface Status{
    loading:boolean;
    error:string|null;
    success:boolean;
};
export interface BillingMasterState{
    list:BillingMaster[];
    detail:BillingMaster|null;

    listStatus:Status;
    detailStatus:Status;
    createStatus:Status;
};