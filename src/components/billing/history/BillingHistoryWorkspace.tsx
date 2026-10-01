"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import BillingHistorySearchForm from "@/components/billing/history/BillingHistorySerachForm";
import BillingHistorySearchDetail from "@/components/billing/history/BillingHistorySerachDetail";
import { resetBillingHistory } from "@/features/billing/history/slice";
import type { AppDispatch } from "@/store/store";

export default function BillingHistoryWorkspace() {
    const dispatch = useDispatch<AppDispatch>();
    // 한 환자가 여러 건 결제했을 수 있어서 환자(patientId)가 아니라 수납 건(billingId) 단위로 선택
    const [selectedBillingId, setSelectedBillingId] = useState<string | null>(null);

    // redux store는 페이지를 이동해도 유지되므로, 화면을 떠날 때 검색 결과/상세를 비운다.
    useEffect(() => {
        return () => {
            dispatch(resetBillingHistory());
        };
    }, [dispatch]);

    return (
        <div className="flex h-full min-h-0 flex-col gap-4">
            <header>
                <p className="text-xs font-semibold tracking-[0.14em] text-sky-600">BILLING</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Billing History Lookup</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Search for a patient and select from the list to view their billing history on the right.
                </p>
            </header>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <BillingHistorySearchForm
                    selectedBillingId={selectedBillingId}
                    onSelectBilling={setSelectedBillingId}
                />
                <BillingHistorySearchDetail billingId={selectedBillingId} />
            </div>
        </div>
    );
}
