"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { paymentRequest, resetPayment } from "@/features/billing/payment/slice";
import type { PaymentMethodCode } from "@/features/billing/payment/types";
import type { AppDispatch, RootState } from "@/store/store";
import { Alert, Button, Modal } from "@/components/common";

interface PaymentRequestProps {
  billingId: string;
  paymentAmount: number;
  open: boolean;
  onClose: () => void;
}

const PAYMENT_METHODS: { code: PaymentMethodCode; label: string }[] = [
  { code: "CASH", label: "Cash" },
  { code: "CARD", label: "Card" },
  { code: "KAKAO_PAY", label: "KakaoPay" },
];

const PaymentRequest = ({ billingId, paymentAmount, open, onClose }: PaymentRequestProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, success } = useSelector((state: RootState) => state.billingPayment);

  const [paymentMethodCode, setPaymentMethodCode] = useState<PaymentMethodCode | "">("");

  const handlePayment = () => {
    if (!paymentMethodCode) {
      alert("Please select a payment method.");
      return;
    }
    dispatch(paymentRequest({ billingId, paymentMethodCode }));
  };

  const handleClose = () => {
    setPaymentMethodCode("");
    dispatch(resetPayment());
    onClose();
  };

  return (
    <Modal open={open} title="Payment" onClose={handleClose} closeDisabled={loading}>
      <div className="flex flex-col gap-4">
        <div className="rounded-xl bg-slate-50/80 px-4 py-3">
          <p className="text-xs font-medium text-slate-400">Payment Amount</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            ₩{paymentAmount.toLocaleString()}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {PAYMENT_METHODS.map(({ code, label }) => (
            <label
              key={code}
              className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm transition-colors ${
                paymentMethodCode === code
                  ? "border-sky-400 bg-sky-50/80 text-sky-700"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={code}
                checked={paymentMethodCode === code}
                onChange={() => setPaymentMethodCode(code)}
                className="h-4 w-4 accent-sky-600"
              />
              <span className="font-medium">{label}</span>
            </label>
          ))}
        </div>

        {error ? <Alert variant="error">{error}</Alert> : null}
        {success ? <Alert variant="success">Payment completed successfully.</Alert> : null}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            {success ? "Close" : "Cancel"}
          </Button>
          {!success ? (
            <Button variant="primary" onClick={handlePayment} disabled={loading}>
              {loading ? "Processing..." : "Pay"}
            </Button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
};

export default PaymentRequest;
