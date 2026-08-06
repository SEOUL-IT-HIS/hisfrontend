"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "next/navigation";
import type { AppDispatch, RootState } from "@/store/store";
import { fetchBillingMasterDetailRequest } from "@/features/billing/billingMaster/slice";

export default function BillingMasterDetail() {
    const { billingId } = useParams<{ billingId: string }>();
    const dispatch = useDispatch<AppDispatch>();
    const { detail, detailStatus } = useSelector((state: RootState) => state.billingMaster);

    useEffect(() => {
        if (!billingId) return;
        dispatch(fetchBillingMasterDetailRequest(billingId));
    }, [billingId, dispatch]);

    return (
        <div>
            {detailStatus.loading && <p>로딩중...</p>}
            {detailStatus.error && <p>{detailStatus.error}</p>}
            {!detailStatus.loading && detail && (
                <>
                    <p>{detail.feeName} ({detail.feeCode})</p>
                    <p>가격: {detail.defaultPrice}</p>
                    <p>분류: {detail.categoryCode} / 보험유형: {detail.insuranceTypeCode}</p>
                    <p>유효기간: {detail.effectiveFrom} ~ {detail.effectiveTo}</p>
                    <p>사용여부: {detail.useYn}</p>
                </>
            )}
        </div>
    );
}
