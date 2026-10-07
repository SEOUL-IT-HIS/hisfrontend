"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchBillingMasterDetailRequest,
  resetBillingMasterUpdateStatus,
  selectBillingMasterDetail,
  selectBillingMasterDetailStatus,
  selectBillingMasterUpdateStatus,
  selectBillingMasterUpdateSuccess,
  updateBillingMasterRequest,
} from "@/features/billing/billingMaster/slice";
import { Alert, FormActions, FormField, Input, Panel, Select } from "@/components/common";
import type { AppDispatch } from "@/store/store";

// Only these fields can be edited. The codes identify the fee, so they are shown read-only.
type BillingMasterEditFormState = {
  feeName: string;
  defaultPrice: string;
  effectiveFrom: string;
  effectiveTo: string;
  useYn: string;
};

const USE_YN_OPTIONS = [
  { value: "Y", label: "Active" },
  { value: "N", label: "Inactive" },
];

// The API returns "yyyy-MM-ddTHH:mm" - a date input needs "yyyy-MM-dd"
function toDateInput(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : "";
}

// The API returns the price as "12500.00" - show it without trailing decimals in the input
function toPriceInput(value: string | null | undefined): string {
  const amount = Number(value);
  return value == null || Number.isNaN(amount) ? "" : String(amount);
}

const BillingMasterEditForm = () => {
  const { billingId } = useParams<{ billingId: string }>();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const detail = useSelector(selectBillingMasterDetail);
  const detailStatus = useSelector(selectBillingMasterDetailStatus);
  const { loading, error } = useSelector(selectBillingMasterUpdateStatus);
  const updateSuccess = useSelector(selectBillingMasterUpdateSuccess);

  const [form, setForm] = useState<BillingMasterEditFormState | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Load the billing master to edit (also clears any previous update result)
  useEffect(() => {
    if (!billingId) return;
    dispatch(resetBillingMasterUpdateStatus());
    dispatch(fetchBillingMasterDetailRequest(billingId));
  }, [billingId, dispatch]);

  // Fill the form once the requested billing master has arrived (the store may still hold a previous one)
  useEffect(() => {
    if (!detail || detail.billingMasterId !== billingId) return;
    setForm({
      feeName: detail.feeName,
      defaultPrice: toPriceInput(detail.defaultPrice),
      effectiveFrom: toDateInput(detail.effectiveFrom),
      effectiveTo: toDateInput(detail.effectiveTo),
      useYn: detail.useYn,
    });
  }, [detail, billingId]);

  // On success: go back to the detail page
  useEffect(() => {
    if (submitted && updateSuccess) {
      dispatch(resetBillingMasterUpdateStatus());
      router.push(`/billing/statistics/${billingId}`);
    }
  }, [dispatch, router, billingId, submitted, updateSuccess]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // prevent page reload
    if (!form) return;
    setSubmitted(true);
    dispatch(updateBillingMasterRequest({ billingMasterId: billingId, payload: form }));
  };

  const goBack = () => router.push(`/billing/statistics/${billingId}`);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-sky-600">BILLING</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Edit Billing Master</h1>
          <p className="mt-1 text-sm text-slate-500">
            Update the fee name, default price, effective period, and status.
          </p>
        </div>
      </header>

      {detailStatus.error ? <Alert variant="error">{detailStatus.error}</Alert> : null}

      <Panel>
        {detailStatus.loading || !form || !detail ? (
          <p className="py-16 text-center text-sm text-slate-400">
            {detailStatus.loading ? "Loading detail information..." : "No detail information available."}
          </p>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4 px-5 py-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Source Service Code" htmlFor="sourceServiceCode">
                <Input id="sourceServiceCode" value={detail.sourceServiceCode} disabled readOnly />
              </FormField>

              <FormField label="Fee Code" htmlFor="feeCode">
                <Input id="feeCode" value={detail.feeCode} disabled readOnly />
              </FormField>

              <FormField label="Fee Name" required htmlFor="feeName">
                <Input
                  id="feeName"
                  name="feeName"
                  placeholder="Fee name"
                  value={form.feeName}
                  onChange={onChange}
                  required
                />
              </FormField>

              <FormField label="Default Price" required htmlFor="defaultPrice">
                <Input
                  id="defaultPrice"
                  name="defaultPrice"
                  type="number"
                  min={0}
                  placeholder="Default price"
                  value={form.defaultPrice}
                  onChange={onChange}
                  required
                />
              </FormField>

              <FormField label="Effective From" required htmlFor="effectiveFrom">
                <Input
                  id="effectiveFrom"
                  name="effectiveFrom"
                  type="date"
                  value={form.effectiveFrom}
                  onChange={onChange}
                  required
                />
              </FormField>

              <FormField label="Effective To" required htmlFor="effectiveTo">
                <Input
                  id="effectiveTo"
                  name="effectiveTo"
                  type="date"
                  value={form.effectiveTo}
                  onChange={onChange}
                  required
                />
              </FormField>

              <FormField label="Status" htmlFor="useYn">
                <Select id="useYn" name="useYn" value={form.useYn} onChange={onChange} options={USE_YN_OPTIONS} />
              </FormField>
            </div>

            {error ? <Alert variant="error">{error}</Alert> : null}

            <FormActions
              onCancel={goBack}
              cancelLabel="Cancel"
              submitLabel="Save"
              loading={loading}
              loadingLabel="Saving..."
            />
          </form>
        )}
      </Panel>
    </div>
  );
};

export default BillingMasterEditForm;
