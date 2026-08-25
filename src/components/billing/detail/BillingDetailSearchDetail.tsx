"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { fetchBillingDetailRequest } from "@/features/billing/searchBillingDetail/slice";
import PaymentRequest from "@/features/billing/payment/PaymentRequest";
import type { AppDispatch, RootState } from "@/store/store";

const BillingDetailSearchDetail = () => {
  const { billingDetailId: billingId } = useParams<{ billingDetailId: string }>();
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
    dispatch(fetchBillingDetailRequest(billingId));
  }, [billingId, dispatch]);

  const onPayment = () => {
    if (!detail) return;
    setPaymentOpen(true);
  };

  return (
    <div>
      {loading && <p>로딩중...</p>}
      {error && <p>{error}</p>}

      {!loading && detail && (
        <>
          <div>환자 정보</div>
          <div>환자명: {detail.patientName}</div>
          <div>주소: {detail.addr}</div>
          <div>전화번호: {detail.tel}</div>
          <div>외래 진료비: {detail.outpatientAmount}</div>
          <div>입퇴원 진료비: {detail.inpatientAmount}</div>
          <div>총 진료비: {detail.totalAmount}</div>
          <div>수납 상태: {detail.billingStatus}</div>

          <button onClick={onPayment}>결제화면</button>

          <PaymentRequest
            billingId={detail.billingId}
            paymentAmount={detail.totalAmount}
            open={paymentOpen}
            onClose={() => setPaymentOpen(false)}
          />
        </>
      )}
    </div>
  );
};

export default BillingDetailSearchDetail;