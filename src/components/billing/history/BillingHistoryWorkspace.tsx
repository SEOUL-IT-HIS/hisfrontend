"use client";

import { useState } from "react";
import BillingHistorySearchForm from "@/components/billing/history/BillingHistorySerachForm";
import BillingHistorySearchDetail from "@/components/billing/history/BillingHistorySerachDetail";

export default function BillingHistoryWorkspace() {
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

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
                    selectedPatientId={selectedPatientId}
                    onSelectPatient={setSelectedPatientId}
                />
                <BillingHistorySearchDetail patientId={selectedPatientId} />
            </div>
        </div>
    );
}
