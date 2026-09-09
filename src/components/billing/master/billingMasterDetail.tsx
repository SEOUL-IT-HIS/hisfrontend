"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { fetchBillingMasterDetailRequest } from "@/features/billing/billingMaster/slice";
import { Alert, Button, Panel, StatusBadge } from "@/components/common";
import type { AppDispatch, RootState } from "@/store/store";

function formatPrice(value: string): string {
  const amount = Number(value);
  return Number.isNaN(amount) ? value : `${amount.toLocaleString()}원`;
}

const BillingMasterDetail = () => {
  const { billingId } = useParams<{ billingId: string }>();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const { loading, error, detail } = useSelector(
    (state: RootState) => ({
      loading: state.billingMaster.detailStatus.loading,
      error: state.billingMaster.detailStatus.error,
      detail: state.billingMaster.detail,
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
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">수납 기준정보 상세</h1>
          <p className="mt-1 text-sm text-slate-500">등록된 수가 기준정보의 상세 내용을 확인합니다.</p>
        </div>
        <Button variant="secondary" onClick={() => router.push("/billing/statistics")}>
          목록으로
        </Button>
      </header>

      {error ? <Alert variant="error">{error}</Alert> : null}

      <Panel>
        <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
          {loading ? (
            <p className="py-16 text-center text-sm text-slate-400">상세 정보를 불러오는 중입니다...</p>
          ) : !detail ? (
            <p className="py-16 text-center text-sm text-slate-400">상세 정보가 없습니다.</p>
          ) : (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <DetailField label="서비스 구분 코드" value={detail.sourceServiceCode} />
              <DetailField label="수가 코드" value={detail.feeCode} />
              <DetailField label="수가 명칭" value={detail.feeName} />
              <DetailField label="기본 단가" value={formatPrice(detail.defaultPrice)} emphasize />
              <DetailField label="분류 코드" value={detail.categoryCode} />
              <DetailField label="급여/비급여 코드" value={detail.insuranceTypeCode} />
              <DetailField label="적용 시작일" value={detail.effectiveFrom} />
              <DetailField label="적용 종료일" value={detail.effectiveTo} />
              <DetailField label="사용 여부" value={<StatusBadge value={detail.useYn} />} />
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
