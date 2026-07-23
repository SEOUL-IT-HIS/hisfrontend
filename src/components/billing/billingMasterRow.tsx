"use client"

import type { BillingMaster } from "@/features/billing/BillingMaster/types";

const BillingMasterRow = ({ billingMaster }: { billingMaster: BillingMaster }) => {
    

    return (

            <div>
            

        
            <p>{billingMaster.feeName} ({billingMaster.feeCode})</p>
            <p>가격: {billingMaster.defaultPrice}</p>
            <p>분류: {billingMaster.categoryCode} / 보험유형: {billingMaster.insuranceTypeCode}</p>
            <p>유효기간: {billingMaster.effectiveFrom} ~ {billingMaster.effectiveTo}</p>
            <p>사용여부: {billingMaster.useYn}</p>
        </div>
    );
};

export default BillingMasterRow;
