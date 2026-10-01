"use client";

import type { SearchPatientResult } from "@/features/billing/history/types";

type BillingHistorySearchListProps = {
    patient: SearchPatientResult;
    selected: boolean;
    onSelect: (billingId: string) => void;
};

const BILLING_TYPE_LABEL: Record<string, string> = {
    OUTPATIENT: "Outpatient",
    INPATIENT: "Inpatient",
};

export default function BillingHistorySearchList({
    patient,
    selected,
    onSelect,
}: BillingHistorySearchListProps) {
    return (
        <tr
            onClick={() => onSelect(patient.billingId)}
            className={
                selected
                    ? "relative cursor-pointer bg-sky-50/80 transition-colors"
                    : "cursor-pointer border-t border-slate-50 transition-colors hover:bg-slate-50"
            }
        >
            <td className="relative px-5 py-3.5">
                {selected ? (
                    <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-sky-500" />
                ) : null}
                <span className={selected ? "font-semibold text-sky-700" : "font-semibold text-slate-800"}>
                    {patient.patientName}
                </span>
            </td>
            <td className="px-5 py-3.5 text-slate-600">{patient.birthDate}</td>
            {/* 같은 환자의 여러 결제 건을 구분할 수 있도록 건별 정보를 표시 */}
            <td className="px-5 py-3.5 text-slate-600">
                {BILLING_TYPE_LABEL[patient.billingType] ?? patient.billingType}
            </td>
            <td className="px-5 py-3.5 text-right font-medium text-slate-800">
                ₩{(patient.paymentAmount ?? 0).toLocaleString()}
            </td>
            <td className="px-5 py-3.5 text-slate-600">
                {/* LocalDateTime이 "2026-10-01T09:11:33" 형태로 오므로 "2026-10-01 09:11"로 표시 */}
                {patient.paymentAt ? patient.paymentAt.replace("T", " ").slice(0, 16) : "-"}
            </td>
        </tr>
    );
}
