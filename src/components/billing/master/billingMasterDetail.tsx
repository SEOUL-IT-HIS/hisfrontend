"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { fetchBillingMasterDetailRequest } from "@/features/billing/billingMaster/slice";
import { Alert, Button, Panel, StatusBadge } from "@/components/common";
import type { AppDispatch, RootState } from "@/store/store";

// The API returns "yyyy-MM-ddTHH:mm" - only the date part is needed on screen
function formatDate(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : "";
}

function formatPrice(value: string): string {
  const amount = Number(value);
  return Number.isNaN(amount) ? value : `₩${amount.toLocaleString()}`;
}

const BillingMasterDetail = () => {
  const { billingId } = useParams<{ billingId: string }>();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const { loading, error, detail } = useSelector(
    (state: RootState) => ({
      loading: state.billing.billingMaster.detailStatus.loading,
      error: state.billing.billingMaster.detailStatus.error,
      detail: state.billing.billingMaster.detail,
    }),
    shallowEqual,
  );

  useEffect(() => {
    if (!billingId) return;
    dispatch(fetchBillingMasterDetailRequest(billingId));
  }, [billingId, dispatch]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-sky-600">BILLING</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Billing Master Detail</h1>
          <p className="mt-1 text-sm text-slate-500">View the details of a registered fee master.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push("/billing/statistics")}>
            Back to List
          </Button>
          <Button
            variant="primary"
            disabled={!detail}
            onClick={() => router.push(`/billing/statistics/${billingId}/edit`)}
          >
            Edit
          </Button>
        </div>
      </header>

      {error ? <Alert variant="error">{error}</Alert> : null}

      <Panel>
        <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
          {loading ? (
            <p className="py-16 text-center text-sm text-slate-400">Loading detail information...</p>
          ) : !detail ? (
            <p className="py-16 text-center text-sm text-slate-400">No detail information available.</p>
          ) : (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <DetailField label="Source Service Code" value={detail.sourceServiceCode} />
              <DetailField label="Fee Code" value={detail.feeCode} />
              <DetailField label="Fee Name" value={detail.feeName} />
              <DetailField label="Default Price" value={formatPrice(detail.defaultPrice)} emphasize />
              <DetailField label="Effective From" value={formatDate(detail.effectiveFrom)} />
              <DetailField label="Effective To" value={formatDate(detail.effectiveTo)} />
              <DetailField
                label="Status"
                value={<StatusBadge value={detail.useYn} activeLabel="Active" inactiveLabel="Inactive" />}
              />
            </dl>
          )}
        </div>
      </Panel>
    </div>
  );
};

function DetailField({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: ReactNode;
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

export default BillingMasterDetail;
