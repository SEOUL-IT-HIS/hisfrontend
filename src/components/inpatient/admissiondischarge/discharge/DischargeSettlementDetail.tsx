"use client";

import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "next/navigation";
import type { AppDispatch } from "@/store/store";
import {
  admissionBillingDetailRequest,
  updateBillingStatusRequest,
  selectAdmissionDetail,
  selectAdmissionDetailLoading,
  selectAdmissionDetailError,
  selectBillingDetailLoading,
  selectBillingDetailError,
} from "@/features/billing/searchBillingDetail/slice";
import { Alert, Button, PageHeader } from "@/components/common";
import SectionCard, { InfoRow } from "@/components/inpatient/common/SectionCard";

const DischargeSettlementDetail = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { admissionId }: { admissionId: string } = useParams();
  const billing = useSelector(selectAdmissionDetail);
  const loading = useSelector(selectAdmissionDetailLoading);
  const error = useSelector(selectAdmissionDetailError);
  const closeLoading = useSelector(selectBillingDetailLoading);
  const closeError = useSelector(selectBillingDetailError);
  const wasClosing = useRef(false);

  useEffect(() => {
    if (!admissionId) return;
    dispatch(admissionBillingDetailRequest(admissionId));
  }, [admissionId, dispatch]);

  useEffect(() => {
    if (closeLoading) {
      wasClosing.current = true;
    } else if (wasClosing.current && !closeError && admissionId) {
      wasClosing.current = false;
      dispatch(admissionBillingDetailRequest(admissionId));
    }
  }, [closeLoading, closeError, admissionId, dispatch]);

  const handleCloseBilling = () => {
    if (!billing) return;
    dispatch(updateBillingStatusRequest(billing.billingId));
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6">
      <PageHeader title="Discharge Billing" description="Admission billing for this discharge." />

      {loading && <p className="text-sm text-slate-400">Loading...</p>}
      {error && <Alert>{error}</Alert>}
      {!loading && billing && (
        <SectionCard
          title={billing.itemName}
          padded={false}
          actions={
            billing.billingStatus === "READY" && (
              <Button onClick={handleCloseBilling} disabled={closeLoading}>
                {closeLoading ? "Processing..." : "Close Billing"}
              </Button>
            )
          }
        >
          <InfoRow label="Quantity">{billing.quantity}</InfoRow>
          <InfoRow label="Unit Price">{billing.unitPrice}</InfoRow>
          <InfoRow label="Amount">{billing.amount}</InfoRow>
          <InfoRow label="Billing Status">{billing.billingStatus}</InfoRow>
          {billing.billingStatus === "SUCCESS" && (
            <Alert variant="success" className="m-4">Billing Closed</Alert>
          )}
          {closeError && <Alert className="m-4">{closeError}</Alert>}
        </SectionCard>
      )}
    </div>
  );
};

export default DischargeSettlementDetail;
