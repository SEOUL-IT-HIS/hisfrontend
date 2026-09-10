"use client";

import { useEffect, useState } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { fetchBillingDetailRequest } from "@/features/billing/searchBillingDetail/slice";
import PaymentRequest from "@/components/billing/payment/PaymentRequest";
import type { AppDispatch, RootState } from "@/store/store";
import { Alert, Button, DataTable, Panel } from "@/components/common";
import type { DataTableColumn } from "@/components/common";
import type { BillingDetailItem } from "@/features/billing/searchBillingDetail/types";

type BillingDetailSearchDetailProps = {
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

function formatAmount(value: number): string {
  return `₩${value.toLocaleString()}`;
}

function formatAmountText(value: string): string {
  const amount = Number(value);
  return Number.isNaN(amount) ? value : `₩${amount.toLocaleString()}`;
}

const ITEM_COLUMNS: DataTableColumn<BillingDetailItem>[] = [
  { key: "occurredAt", header: "Occurred At", render: (row) => row.occurredAt },
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
  {
    key: "detailStatus",
    header: "Status",
    render: (row) => (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
          STATUS_TONE[row.detailStatus] ?? "bg-slate-100 text-slate-500 ring-slate-500/10"
        }`}
      >
        {STATUS_LABEL[row.detailStatus] ?? row.detailStatus}
      </span>
    ),
  },
];

const BillingDetailSearchDetail = ({ billingId }: BillingDetailSearchDetailProps) => {
  const dispatch = useDispatch<AppDispatch>();

  const [paymentOpen, setPaymentOpen] = useState(false); // 결제 모달 open 상태

  const { loading, error, detail } = useSelector(
    (state: RootState) => ({
      loading: state.billingDetail.detailStatus.loading,
      error: state.billingDetail.detailStatus.error,
      detail: state.billingDetail.detail,
    }),
    shallowEqual,
  ); // 진료비 상세조회 Redux State

  useEffect(() => {
    if (!billingId) return;
    setPaymentOpen(false);
    dispatch(fetchBillingDetailRequest(billingId));
  }, [billingId, dispatch]);

  // 환자 미선택
  if (billingId === null) {
    return (
      <Panel dashed>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <span className="text-lg font-semibold">+</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Select a patient</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Click view details in the list on the left
              <br />
              to see the billing detail information here.
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
              {detail?.patientName ?? "Billing Detail"}
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
          <p className="mt-1 text-xs text-slate-400">Review billing details and proceed to payment</p>
        </div>
        {detail && detail.billingStatus === "READY" ? (
          <Button variant="primary" onClick={() => setPaymentOpen(true)}>
            Payment
          </Button>
        ) : null}
      </div>

      {error ? (
        <div className="px-5 pt-4">
          <Alert variant="error">{error}</Alert>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
        {loading ? (
          <p className="py-16 text-center text-sm text-slate-400">Loading detail information...</p>
        ) : detail == null ? (
          <p className="py-16 text-center text-sm text-slate-400">No detail information available.</p>
        ) : (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <DetailField label="PatientId" value={detail.patientId} />
            <DetailField label="PatientName" value={detail.patientName} />
            <DetailField label="PhoneNo" value={detail.phoneNo} />
            <DetailField label="Address" value={detail.address} />
            <DetailField label="OutpatientAmount" value={formatAmount(detail.outpatientAmount)} />
            <DetailField label="InpatientAmount" value={formatAmount(detail.inpatientAmount)} />
            <DetailField label="TotalAmount" value={formatAmount(detail.totalAmount)} emphasize />
            <DetailField
              label="BillingStatus"
              value={STATUS_LABEL[detail.billingStatus] ?? detail.billingStatus}
            />
          </dl>
        )}

        {!loading && detail ? (
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Billing Detail Items</h3>
            <DataTable
              columns={ITEM_COLUMNS}
              rows={detail.items}
              rowKey={(row) => `${row.occurredAt}-${row.feeCode}-${row.quantity}-${row.unitPrice}-${row.amount}`}
              emptyMessage="No billing detail items."
              minWidthClassName="min-w-[760px]"
            />
          </div>
        ) : null}
      </div>

      {detail ? (
        <PaymentRequest
          billingId={detail.billingId}
          paymentAmount={detail.totalAmount}
          open={paymentOpen}
          onClose={() => setPaymentOpen(false)}
        />
      ) : null}
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

export default BillingDetailSearchDetail;
