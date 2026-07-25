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
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
      {detailStatus.loading ? <p className="text-slate-400">로딩중...</p> : null}
      {detailStatus.error ? <p className="text-rose-600">{detailStatus.error}</p> : null}
      {!detailStatus.loading && detail ? (
        <>
          <p>항목코드: {detail.feeCode}</p>
          <p>항목명: {detail.feeName}</p>
          <p>기본가격: {detail.defaultPrice}</p>
          <p>
            분류: {detail.categoryCode} / 보험유형: {detail.insuranceTypeCode}
          </p>
          <p>
            유효기간: {detail.effectiveFrom} ~ {detail.effectiveTo}
          </p>
          <p>사용여부: {detail.useYn}</p>
        </>
      ) : null}
    </div>
  );
}
