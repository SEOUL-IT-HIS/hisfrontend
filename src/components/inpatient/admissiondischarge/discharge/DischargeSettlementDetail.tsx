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
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>{error}</p>}
      {!loading && billing && (
        <div>
          <p>Billing ID: {billing.billingId}</p>
          <p>Admission ID: {billing.admissionId}</p>
          <p>Item Name: {billing.itemName}</p>
          <p>Quantity: {billing.quantity}</p>
          <p>Unit Price: {billing.unitPrice}</p>
          <p>Amount: {billing.amount}</p>
          <p>Billing Status: {billing.billingStatus}</p>

          {billing.billingStatus === "READY" && (
            <button onClick={handleCloseBilling} disabled={closeLoading}>
              {closeLoading ? "Processing..." : "Close Billing"}
            </button>
          )}
          {billing.billingStatus === "SUCCESS" && <p>Billing Closed</p>}
          {closeError && <p>{closeError}</p>}
        </div>
      )}
    </div>
  );
};

export default DischargeSettlementDetail;
