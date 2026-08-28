"use client"

import { SearchPatientResult } from "@/features/billing/searchBillingDetail/types";

type BillingDetailSearchListProps = {
    patient: SearchPatientResult;
    selected: boolean;
    onSelect: (billingId: string) => void;
};

const STATUS_LABEL: Record<string, string> = {
    READY: "미수납",
    SUCCESS: "수납완료",
};

const billingDetailSearchList = ({ patient, selected, onSelect }: BillingDetailSearchListProps) => {
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
            <td className="px-5 py-3.5 text-slate-600">{patient.phoneNo}</td>
            <td className="px-5 py-3.5 text-slate-600">{patient.address}</td>
            <td className="px-5 py-3.5 text-slate-600">{patient.itemName}</td>
            <td className="px-5 py-3.5">
                <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                        patient.billingStatus === "SUCCESS"
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15"
                            : "bg-amber-50 text-amber-700 ring-amber-600/20"
                    }`}
                >
                    {STATUS_LABEL[patient.billingStatus] ?? patient.billingStatus}
                </span>
            </td>
        </tr>
    );
};

export default billingDetailSearchList;
