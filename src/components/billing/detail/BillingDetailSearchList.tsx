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

/** 미수납 건들의 구분을 "Outpatient 2 · Inpatient 1" 처럼 요약 */
function summarizeTypes(group: PatientBillingGroup): string {
    const counts = new Map<string, number>();
    for (const bill of group.bills) {
        counts.set(bill.billingType, (counts.get(bill.billingType) ?? 0) + 1);
    }
    return Array.from(counts.entries())
        .map(([type, count]) => `${BILLING_TYPE_LABEL[type] ?? type}${count > 1 ? ` ${count}` : ""}`)
        .join(" · ");
}

// 환자 한 명당 한 줄 - 미수납 건이 여러 개여도 금액은 합산해서 보여주고, 클릭하면 오른쪽에서 한 번에 수납
const billingDetailSearchList = ({ group, selected, onSelect }: BillingDetailSearchListProps) => {
    const totalAmount = group.bills.reduce((sum, bill) => sum + (bill.totalAmount ?? 0), 0);
    // createdAt은 "yyyy-MM-dd HH:mm" 문자열이라 문자열 비교로 가장 최근 건을 고를 수 있음
    const latestCreatedAt = group.bills.reduce(
        (latest, bill) => (bill.createdAt > latest ? bill.createdAt : latest),
        "",
    );

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
            <td className="px-5 py-3.5 text-slate-600">{latestCreatedAt}</td>
            <td className="px-5 py-3.5">
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                    {group.bills.length > 1 ? `${group.bills.length} unpaid` : "Unpaid"}
                </span>
            </td>
        </tr>
    );
};

export default billingDetailSearchList;
