"use client"

import { BillingMaster } from "@/features/billing/billingMaster/types";
import { useRouter } from "next/navigation";


const billingMasterRow = ({ billingMaster }: { billingMaster: BillingMaster }) => {
    const router = useRouter();

    return (
            <div>
            <p>{billingMaster.feeName} ({billingMaster.feeCode})</p>
            <p>가격: {billingMaster.defaultPrice}</p>
            <p>분류: {billingMaster.categoryCode} / 보험유형: {billingMaster.insuranceTypeCode}</p>
            <p>유효기간: {billingMaster.effectiveFrom} ~ {billingMaster.effectiveTo}</p>
            <p>사용여부: {billingMaster.useYn}</p>
            <button onClick={() => router.push(`/billing/master/${billingMaster.billingMasterId}`)}>
                    상세보기
                </button>
        </div>
    );
};

export default billingMasterRow;
