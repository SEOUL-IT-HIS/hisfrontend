"use client";

import type { SearchPatientResult } from "@/features/billing/history/types";

type BillingHistorySearchListProps = {
    patient: SearchPatientResult;
    selected: boolean;
    onSelect: (patientId: string) => void;
};

export default function BillingHistorySearchList({
    patient,
    selected,
    onSelect,
}: BillingHistorySearchListProps) {
    return (
        <tr
            onClick={() => onSelect(patient.patientId)}
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
            <td className="px-5 py-3.5 text-slate-600">{patient.phoneNo}</td>
            <td className="px-5 py-3.5 text-slate-600">{patient.address}</td>
        </tr>
    );
}
