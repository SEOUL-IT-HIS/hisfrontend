"use client"

import type { PatientBillingGroup } from "@/features/billing/searchBillingDetail/types";

type BillingDetailSearchListProps = {
    group: PatientBillingGroup;
    selected: boolean;
    onSelect: (patientId: string) => void;
};

const BILLING_TYPE_LABEL: Record<string, string> = {
    OUTPATIENT: "Outpatient",
    INPATIENT: "Inpatient",
};

/** 미수납 건들의 구분을 "Outpatient, Inpatient" 처럼 중복 없이 요약 (건수는 Status 열에 표시) */
function summarizeTypes(group: PatientBillingGroup): string {
    const types = new Set(group.bills.map((bill) => bill.billingType));
    return Array.from(types)
        .map((type) => BILLING_TYPE_LABEL[type] ?? type)
        .join(", ");
}

// 환자 한 명당 한 줄 - 미수납 건이 여러 개여도 금액은 합산해서 보여주고, 클릭하면 오른쪽에서 한 번에 수납
const billingDetailSearchList = ({ group, selected, onSelect }: BillingDetailSearchListProps) => {
    const totalAmount = group.bills.reduce((sum, bill) => sum + (bill.totalAmount ?? 0), 0);

    return (
        <tr
            onClick={() => onSelect(group.patientId)}
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
                    {group.patientName}
                </span>
            </td>
            <td className="px-5 py-3.5 text-slate-600">{group.birthDate}</td>
            <td className="px-5 py-3.5 text-slate-600">{group.phoneNo}</td>
            <td className="px-5 py-3.5 text-slate-600">{summarizeTypes(group)}</td>
            <td className="px-5 py-3.5 text-right font-medium text-slate-800">
                ₩{totalAmount.toLocaleString()}
            </td>
            <td className="px-5 py-3.5">
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                    {group.bills.length > 1 ? `${group.bills.length} unpaid` : "Unpaid"}
                </span>
            </td>
        </tr>
    );
};

export default billingDetailSearchList;
