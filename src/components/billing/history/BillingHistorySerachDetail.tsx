"use client";

import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { AppDispatch, RootState } from "@/store/store";
import { fetchBillingHistoryDetailRequest } from "@/features/billing/history/slice";
import { Alert, DataTable, Panel } from "@/components/common";
import type { DataTableColumn } from "@/components/common";
import type { BillingHistoryDetailItem } from "@/features/billing/history/types";

type BillingHistorySearchDetailProps = {
    billingId: string | null;
};

const STATUS_LABEL: Record<string, string> = {
    READY: "Unpaid",
    SUCCESS: "Paid",
};

const STATUS_TONE: Record<string, string> = {
    READY: "bg-amber-50 text-amber-700 ring-amber-600/20",
    SUCCESS: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
};

const BILLING_TYPE_LABEL: Record<string, string> = {
    OUTPATIENT: "Outpatient",
    INPATIENT: "Inpatient",
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
    CASH: "Cash",
    CARD: "Card",
    KAKAO_PAY: "KakaoPay",
};

function formatAmount(value: number): string {
    return `₩${(value ?? 0).toLocaleString()}`;
}

function formatAmountText(value: string): string {
    const amount = Number(value);
    return Number.isNaN(amount) ? value : `₩${amount.toLocaleString()}`;
}

// LocalDateTime이 "2026-10-01T09:11:33" 형태로 오므로 "2026-10-01 09:11"로 표시
function formatDateTime(value: string): string {
    return value ? value.replace("T", " ").slice(0, 16) : "-";
}

// 결제된 진료 항목 (결제 시 billing만 SUCCESS로 바뀌고 항목별 상태는 갱신되지 않아서 상태 컬럼은 두지 않음)
const ITEM_COLUMNS: DataTableColumn<BillingHistoryDetailItem>[] = [
    { key: "occurredAt", header: "Occurred At", render: (row) => formatDateTime(row.occurredAt) },
    {
        key: "billingType",
        header: "Type",
        render: (row) => BILLING_TYPE_LABEL[row.billingType] ?? row.billingType,
    },
    { key: "feeCode", header: "Fee Code", render: (row) => row.feeCode },
    { key: "itemName", header: "Item Name", render: (row) => row.itemName },
    { key: "quantity", header: "Quantity", render: (row) => row.quantity, className: "text-right" },
    {
        key: "unitPrice",
        header: "Unit Price",
        render: (row) => formatAmountText(row.unitPrice),
        className: "text-right",
    },
    {
        key: "amount",
        header: "Amount",
        render: (row) => (
            <span className="font-semibold text-slate-800">{formatAmountText(row.amount)}</span>
        ),
        className: "text-right",
    },
];

const BillingHistorySearchDetail = ({ billingId }: BillingHistorySearchDetailProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error, detail } = useSelector(
        (state: RootState) => ({
            loading: state.billing.billingHistory.detailStatus.loading,
            error: state.billing.billingHistory.detailStatus.error,
            detail: state.billing.billingHistory.detail,
        }),
        shallowEqual,
    ); // 수납이력 상세조회 Redux State

    useEffect(() => {
        if (!billingId) return;
        dispatch(fetchBillingHistoryDetailRequest(billingId));
    }, [billingId, dispatch]);

    // 수납 건 미선택
    if (billingId === null) {
        return (
            <Panel dashed>
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <span className="text-lg font-semibold">+</span>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-700">Select a billing record</p>
                        <p className="mt-1 text-xs leading-5 text-slate-400">
                            Click a row in the list on the left
                            <br />
                            to see the billing history here.
                        </p>
                    </div>
                </div>
            </Panel>
        );
    }

    return (
        <Panel>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-sm font-semibold text-slate-900">
                            {detail?.patientName ?? "Billing History"}
                        </h2>
                        {detail ? (
                            <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                                    STATUS_TONE[detail.billingStatus] ?? "bg-slate-100 text-slate-500 ring-slate-500/10"
                                }`}
                            >
                                {STATUS_LABEL[detail.billingStatus] ?? detail.billingStatus}
                            </span>
                        ) : null}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">Payment information and billed items for this record</p>
                </div>
            </div>

            {error ? (
                <div className="px-5 pt-4">
                    <Alert variant="error">{error}</Alert>
                </div>
            ) : null}

            <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
                {loading ? (
                    <p className="py-16 text-center text-sm text-slate-400">Loading billing history...</p>
                ) : detail == null ? (
                    <p className="py-16 text-center text-sm text-slate-400">No billing history available.</p>
                ) : (
                    <>
                        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                            <DetailField label="BirthDate" value={detail.birthDate} />
                            <DetailField label="PhoneNo" value={detail.phoneNo} />
                            <DetailField
                                label="Type"
                                value={BILLING_TYPE_LABEL[detail.billingType] ?? detail.billingType}
                            />
                            <DetailField
                                label="Method"
                                value={PAYMENT_METHOD_LABEL[detail.paymentMethod] ?? detail.paymentMethod ?? "-"}
                            />
                            <DetailField label="Payment At" value={formatDateTime(detail.paymentAt)} />
                            <DetailField label="Receipt No" value={detail.receiptNo || "-"} />
                            <DetailField label="Payment Amount" value={formatAmount(detail.paymentAmount)} emphasize />
                        </dl>

                        <div className="mt-6">
                            <h3 className="mb-2 text-sm font-semibold text-slate-900">Billed Items</h3>
                            <DataTable
                                columns={ITEM_COLUMNS}
                                rows={detail.items}
                                rowKey={(row) => `${row.occurredAt}-${row.feeCode}-${row.quantity}-${row.unitPrice}-${row.amount}`}
                                emptyMessage="No billed items."
                                minWidthClassName="min-w-[720px]"
                            />
                        </div>
                    </>
                )}
            </div>
        </Panel>
    );
};

function DetailField({
    label,
    value,
    emphasize = false,
}: {
    label: string;
    value: string;
    emphasize?: boolean;
}) {
    return (
        <div className="rounded-xl bg-slate-50/80 px-4 py-3">
            <dt className="text-xs font-medium text-slate-400">{label}</dt>
            <dd
                className={
                    emphasize
                        ? "mt-1 text-base font-semibold text-sky-700"
                        : "mt-1 text-sm font-medium text-slate-800"
                }
            >
                {value}
            </dd>
        </div>
    );
}

export default BillingHistorySearchDetail;
