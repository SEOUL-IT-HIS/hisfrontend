"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { fetchBillingMasterRequest } from "@/features/billing/billingMaster/slice";
import BillingMasterRow from "@/components/billing/billingMasterRow";
import { Alert, Button, Panel } from "@/components/common";
import type { AppDispatch, RootState } from "@/store/store";

const BillingMaster = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, list } = useSelector(
    (state: RootState) => ({
      loading: state.billingMaster.listStatus.loading,
      error: state.billingMaster.listStatus.error,
      list: state.billingMaster.list,
    }),
    shallowEqual,
  );

  useEffect(() => {
    dispatch(fetchBillingMasterRequest());
  }, [dispatch]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-sky-600">BILLING</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">수납 기준정보</h1>
          <p className="mt-1 text-sm text-slate-500">등록된 수가 기준정보를 조회하고 관리합니다.</p>
        </div>
        <Button variant="primary" onClick={() => router.push("/billing/statistics/register")}>
          수납 기준등록
        </Button>
      </header>

      {error ? <Alert variant="error">{error}</Alert> : null}

      <Panel>
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">수가 목록</h2>
            <p className="mt-0.5 text-xs text-slate-400">행 클릭 시 상세로 이동합니다</p>
          </div>
          <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-white">
            {list?.length ?? 0}건
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 backdrop-blur">
              <tr className="text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">수가명 / 코드</th>
                <th className="px-5 py-3 font-medium">기본단가</th>
                <th className="px-5 py-3 font-medium">분류코드</th>
                <th className="px-5 py-3 font-medium">보험유형</th>
                <th className="px-5 py-3 font-medium">적용기간</th>
                <th className="px-5 py-3 font-medium">사용여부</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-20 text-center text-slate-400">
                    목록을 불러오는 중입니다...
                  </td>
                </tr>
              ) : !list || list.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-20 text-center text-slate-400">
                    등록된 수납 기준정보가 없습니다.
                  </td>
                </tr>
              ) : (
                list.map((item) => <BillingMasterRow key={item.billingMasterId} billingMaster={item} />)
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
};

export default BillingMaster;
