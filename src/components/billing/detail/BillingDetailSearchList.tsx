"use client"

import { SearchPatientResult } from "@/features/billing/searchBillingDetail/types";

type BillingDetailSearchListProps = {
    patient: SearchPatientResult;
    selected: boolean;
    onSelect: (billingId: string) => void;
    /** 같은 환자의 미수납 건이 여러 개라 그룹 하위에 들여써서 보여줄 때 true.
     *  이름/생년월일/전화번호는 그룹 헤더 행에서 한 번만 보여주므로 여기서는 비워둔다. */
    nested?: boolean;
};

const STATUS_LABEL: Record<string, string> = {
    READY: "Unpaid",
    SUCCESS: "Paid",
};

const BILLING_TYPE_LABEL: Record<string, string> = {
    OUTPATIENT: "Outpatient",
    INPATIENT: "Inpatient",
};

const billingDetailSearchList = ({ patient, selected, onSelect, nested = false }: BillingDetailSearchListProps) => {
    return (
        <tr
            onClick={() => onSelect(patient.billingId)}
            className={
                selected
                    ? "relative cursor-pointer bg-sky-50/80 transition-colors"
                    : `cursor-pointer border-t border-slate-50 transition-colors hover:bg-slate-50 ${nested ? "bg-slate-50/40" : ""}`
            }
        >
            <td className={`relative px-5 py-3.5 ${nested ? "pl-9" : ""}`}>
                {selected ? (
                    <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-sky-500" />
                ) : null}
                {!nested ? (
                    <span className={selected ? "font-semibold text-sky-700" : "font-semibold text-slate-800"}>
                        {patient.patientName}
                    </span>
                ) : null}
            </td>
            <td className="px-5 py-3.5 text-slate-600">{nested ? null : patient.birthDate}</td>
            <td className="px-5 py-3.5 text-slate-600">{nested ? null : patient.phoneNo}</td>
            {/* 같은 환자의 여러 건(외래/입원 등)을 구분할 수 있도록 건별 정보를 표시 */}
            <td className="px-5 py-3.5 text-slate-600">
                {BILLING_TYPE_LABEL[patient.billingType] ?? patient.billingType}
            </td>
            <td className="px-5 py-3.5 text-right font-medium text-slate-800">
                ₩{(patient.totalAmount ?? 0).toLocaleString()}
            </td>
            <td className="px-5 py-3.5 text-slate-600">{patient.createdAt}</td>
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
