"use client";

import { useState } from "react";
import BillingDetailSearchForm from "@/components/billing/detail/BillingDetailSearchForm";
import BillingDetailSearchDetail from "@/components/billing/detail/BillingDetailSearchDetail";

export default function BillingDetailWorkspace() {
  const [selectedBillingId, setSelectedBillingId] = useState<string | null>(null);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <header>
        <p className="text-xs font-semibold tracking-[0.14em] text-sky-600">BILLING</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">진료비 상세조회</h1>
        <p className="mt-1 text-sm text-slate-500">
          환자를 검색해 목록에서 선택하면 오른쪽에서 진료비 상세와 결제를 진행할 수 있습니다.
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
