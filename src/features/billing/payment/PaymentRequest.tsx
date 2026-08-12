"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { paymentRequest, resetPayment } from "@/features/billing/payment/slice";
import type { PaymentMethodCode } from "@/features/billing/payment/types";
import type { AppDispatch, RootState } from "@/store/store";

interface PaymentRequestProps {
  billingId: string;
  paymentAmount: number;
  open: boolean;
  onClose: () => void;}

const PAYMENT_METHODS: { code: PaymentMethodCode; label: string }[] = [
  { code: "CASH", label: "현금" },
  { code: "CARD", label: "카드" },
  { code: "KAKAO_PAY", label: "카카오페이" },];

const PaymentRequest = ({ billingId, paymentAmount, open, onClose }: PaymentRequestProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, success } = useSelector((state: RootState) => state.billingPayment);

  const [paymentMethodCode, setPaymentMethodCode] = useState<PaymentMethodCode | "">("");

  if (!open) return null;

  const handlePayment = () => {
    if (!paymentMethodCode) {
      alert("결제 수단을 선택해주세요.");
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
    <div>
      <h2>결제 처리</h2>
      <div>결제 금액: {paymentAmount.toLocaleString()}원</div>
      <hr />

      <div>
        {PAYMENT_METHODS.map(({ code, label }) => (
          <div key={code}>
            <label>
              <input
                type="radio"
                name="paymentMethod"
                value={code}
                checked={paymentMethodCode === code}
                onChange={() => setPaymentMethodCode(code)}
              />
              {label}
            </label>
          </div>
        ))}
      </div>

      <hr />

      {loading && <p>결제 처리중...</p>}
      {error && <p>{error}</p>}
      {success && <p>결제가 성공적으로 완료되었습니다.</p>}

      <button onClick={handleClose}>{success ? "닫기" : "취소"}</button>
      {!success && (
        <button onClick={handlePayment} disabled={loading}>
          결제
        </button>
      )}
    </div>
  );
};

export default PaymentRequest;
