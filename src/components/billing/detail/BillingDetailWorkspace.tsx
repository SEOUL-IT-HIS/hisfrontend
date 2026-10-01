"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import BillingDetailSearchForm from "@/components/billing/detail/BillingDetailSearchForm";
import BillingDetailSearchDetail from "@/components/billing/detail/BillingDetailSearchDetail";
import { resetBillingDetail } from "@/features/billing/searchBillingDetail/slice";
import { resetPayment } from "@/features/billing/payment/slice";
import type { AppDispatch } from "@/store/store";

export default function BillingDetailWorkspace() {
  const dispatch = useDispatch<AppDispatch>();
  const [selectedBillingId, setSelectedBillingId] = useState<string | null>(null);

  // redux store는 페이지를 이동해도 유지되므로, 화면을 떠날 때 검색 결과/상세/결제 상태를 비운다.
  // (안 하면 다시 들어왔을 때 입력창은 빈칸인데 이전 검색 결과가 그대로 보임)
  useEffect(() => {
    return () => {
      dispatch(resetBillingDetail());
      dispatch(resetPayment());
    };
  }, [dispatch]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <header>
        <p className="text-xs font-semibold tracking-[0.14em] text-sky-600">BILLING</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Billing Detail Lookup</h1>
        <p className="mt-1 text-sm text-slate-500">
          Search for a patient and select from the list to view billing details and process payment on the right.
        </p>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <BillingDetailSearchForm
          selectedBillingId={selectedBillingId}
          onSelectPatient={setSelectedBillingId}
        />
        <BillingDetailSearchDetail billingId={selectedBillingId} />
      </div>
    </div>
  );
}
