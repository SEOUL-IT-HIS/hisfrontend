"use client";

import { useState } from "react";
import BillingHistorySearchForm from "@/components/billing/history/BillingHistorySerachForm";
import BillingHistorySearchDetail from "@/components/billing/history/BillingHistorySerachDetail";

export default function BillingHistoryWorkspace() {
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

    return (
        <div>
            <BillingHistorySearchForm
                selectedPatientId={selectedPatientId}
                onSelectPatient={setSelectedPatientId}
            />
            <BillingHistorySearchDetail patientId={selectedPatientId} />
        </div>
    );
}
