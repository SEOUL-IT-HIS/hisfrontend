"use client";

import { useEffect, useState } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { fetchBillingDetailRequest } from "@/features/billing/searchBillingDetail/slice";
import PaymentRequest from "@/components/billing/payment/PaymentRequest";
import type { AppDispatch, RootState } from "@/store/store";
import { Alert, Button, Panel } from "@/components/common";

type BillingDetailSearchDetailProps = {
  billingId: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  READY: "미수납",
  SUCCESS: "수납완료",
};

const STATUS_TONE: Record<string, string> = {
  READY: "bg-amber-50 text-amber-700 ring-amber-600/20",
  SUCCESS: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
};

function formatAmount(value: number): string {
  return `${value.toLocaleString()}원`;
}

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
            <p className="text-sm font-semibold text-slate-700">환자를 선택하세요</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              왼쪽 목록에서 상세보기를 클릭하면
              <br />
              진료비 상세 정보가 여기에 표시됩니다.
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
              {detail?.patientName ?? "진료비 상세"}
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
          <p className="mt-1 text-xs text-slate-400">진료비 상세 내역을 확인하고 결제를 진행합니다</p>
        </div>
        {detail && detail.billingStatus === "READY" ? (
          <Button variant="primary" onClick={() => setPaymentOpen(true)}>
            결제화면
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
          <p className="py-16 text-center text-sm text-slate-400">상세 정보를 불러오는 중입니다...</p>
        ) : detail == null ? (
          <p className="py-16 text-center text-sm text-slate-400">상세 정보가 없습니다.</p>
        ) : (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <DetailField label="환자ID" value={detail.patientId} />
            <DetailField label="환자명" value={detail.patientName} />
            <DetailField label="연락처" value={detail.tel} />
            <DetailField label="주소" value={detail.addr} />
            <DetailField label="외래 진료비" value={formatAmount(detail.outpatientAmount)} />
            <DetailField label="입퇴원 진료비" value={formatAmount(detail.inpatientAmount)} />
            <DetailField label="총 진료비" value={formatAmount(detail.totalAmount)} emphasize />
            <DetailField
              label="수납 상태"
              value={STATUS_LABEL[detail.billingStatus] ?? detail.billingStatus}
            />
          </dl>
        )}
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
