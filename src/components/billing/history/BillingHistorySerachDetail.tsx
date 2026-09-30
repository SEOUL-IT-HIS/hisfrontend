"use client";

import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { AppDispatch, RootState } from "@/store/store";
import { fetchBillingHistoryDetailRequest } from "@/features/billing/history/slice";
import { Alert, DataTable, Panel } from "@/components/common";
import type { DataTableColumn } from "@/components/common";
import type { BillingHistoryItem } from "@/features/billing/history/types";

type BillingHistorySearchDetailProps = {
    patientId: string | null;
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
    return `₩${value.toLocaleString()}`;
}

const HISTORY_COLUMNS: DataTableColumn<BillingHistoryItem>[] = [
    { key: "paymentAt", header: "Payment At", render: (row) => row.paymentAt || "-" },
    {
        key: "billingType",
        header: "Type",
        render: (row) => BILLING_TYPE_LABEL[row.billingType] ?? row.billingType,
    },
    {
        key: "paymentMethod",
        header: "Method",
        render: (row) => PAYMENT_METHOD_LABEL[row.paymentMethod] ?? row.paymentMethod ?? "-",
    },
    {
        key: "paymentAmount",
        header: "Amount",
        render: (row) => (
            <span className="font-semibold text-slate-800">{formatAmount(row.paymentAmount)}</span>
        ),
        className: "text-right",
    },
    { key: "receiptNo", header: "Receipt No", render: (row) => row.receiptNo || "-" },
    {
        key: "billingStatus",
        header: "Status",
        render: (row) => (
            <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                    STATUS_TONE[row.billingStatus] ?? "bg-slate-100 text-slate-500 ring-slate-500/10"
                }`}
            >
                {STATUS_LABEL[row.billingStatus] ?? row.billingStatus}
            </span>
        ),
    },
];

const BillingHistorySearchDetail = ({ patientId }: BillingHistorySearchDetailProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error, detail } = useSelector(
        (state: RootState) => ({
            loading: state.billing.billingHistory.detailStatus.loading,
            error: state.billing.billingHistory.detailStatus.error,
            detail: state.billing.billingHistory.detail,
        }),
        shallowEqual,
    ); // 진료비 상세조회 Redux State

    useEffect(() => {
        if (!patientId) return;
        dispatch(fetchBillingHistoryDetailRequest(patientId));
    }, [patientId, dispatch]);

    // 환자 미선택
    if (patientId === null) {
        return (
            <Panel dashed>
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <span className="text-lg font-semibold">+</span>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-700">Select a patient</p>
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
                    <h2 className="truncate text-sm font-semibold text-slate-900">
                        {detail[0]?.patientName ?? "Billing History"}
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">Past billing and payment records for this patient</p>
                </div>
                <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-white">
                    {detail.length} records
                </span>
            </div>

            {error ? (
                <div className="px-5 pt-4">
                    <Alert variant="error">{error}</Alert>
                </div>
            ) : null}

            <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
                <DataTable
                    columns={HISTORY_COLUMNS}
                    rows={detail}
                    rowKey={(row) => row.billingId}
                    loading={loading}
                    loadingMessage="Loading billing history..."
                    emptyMessage="No billing history available."
                    minWidthClassName="min-w-[720px]"
                />
            </div>
        </Panel>
    );
};

export default BillingHistorySearchDetail;
