"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  registerBillingMasterRequest,
  resetBillingMasterCreateStatus,
  selectBillingMasterCreateSuccess,
} from "@/features/billing/billingMaster/slice";
import { Alert, FormActions, FormField, Input, Panel } from "@/components/common";
import type { AppDispatch, RootState } from "@/store/store";

type BillingMasterFormState = {
  sourceServiceCode: string;
  feeCode: string;
  feeName: string;
  defaultPrice: string;
  categoryCode: string;
  insuranceTypeCode: string;
  effectiveFrom: string;
  effectiveTo: string;
};

const initialForm: BillingMasterFormState = {
  sourceServiceCode: "",
  feeCode: "",
  feeName: "",
  defaultPrice: "",
  categoryCode: "",
  insuranceTypeCode: "",
  effectiveFrom: "",
  effectiveTo: "",
};

const BillingMasterRegisterForm = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.billing.billingMaster.createStatus);
  const createSuccess = useSelector(selectBillingMasterCreateSuccess);

  const [form, setForm] = useState<BillingMasterFormState>(initialForm);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    dispatch(resetBillingMasterCreateStatus());
  }, [dispatch]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // prevent page reload
    setSubmitted(true);
    dispatch(registerBillingMasterRequest(form));
  };

  // On success: reset the form/state and go back to the list
  useEffect(() => {
    if (submitted && createSuccess) {
      dispatch(resetBillingMasterCreateStatus());
      setForm(initialForm);
      router.push("/billing/statistics");
    }
  }, [dispatch, createSuccess, router, submitted]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-sky-600">BILLING</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Register Billing Master</h1>
          <p className="mt-1 text-sm text-slate-500">Register new fee master information.</p>
        </div>
      </header>

      <Panel>
        <form onSubmit={onSubmit} className="flex flex-col gap-4 px-5 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Source Service Code" required htmlFor="sourceServiceCode">
              <Input
                id="sourceServiceCode"
                name="sourceServiceCode"
                placeholder="Source service code"
                value={form.sourceServiceCode}
                onChange={onChange}
                required
              />
            </FormField>

            <FormField label="Fee Code" required htmlFor="feeCode">
              <Input
                id="feeCode"
                name="feeCode"
                placeholder="Fee code"
                value={form.feeCode}
                onChange={onChange}
                required
              />
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
                placeholder="Default price"
                value={form.defaultPrice}
                onChange={onChange}
                required
              />
            </FormField>

            <FormField label="Category Code" required htmlFor="categoryCode">
              <Input
                id="categoryCode"
                name="categoryCode"
                placeholder="Category code"
                value={form.categoryCode}
                onChange={onChange}
                required
              />
            </FormField>

            <FormField label="Insurance Type Code" required htmlFor="insuranceTypeCode">
              <Input
                id="insuranceTypeCode"
                name="insuranceTypeCode"
                placeholder="Insurance type code"
                value={form.insuranceTypeCode}
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
          </div>

          {error ? <Alert variant="error">{error}</Alert> : null}

          <FormActions
            onCancel={() => router.push("/billing/statistics")}
            submitLabel="Register"
            cancelLabel="Cancel"
            loading={loading}
            loadingLabel="Registering..."
          />
        </form>
      </Panel>
    </div>
  );
};

export default BillingMasterRegisterForm;
