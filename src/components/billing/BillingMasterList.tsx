"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import type { AppDispatch, RootState } from "@/store/store";
import { fetchBillingMasterRequest } from "@/features/billing/billingMaster/slice";
import BillingMasterRow from "@/components/billing/BillingMasterRow";

export default function BillingMasterList() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { list, listStatus } = useSelector((state: RootState) => state.billingMaster);

  useEffect(() => {
    dispatch(fetchBillingMasterRequest());
  }, [dispatch]);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
        <h2 className="text-base font-semibold text-slate-800">수납 기준정보</h2>
        <button
          type="button"
          onClick={() => router.push("/billing/master/register")}
          className="h-9 rounded-lg bg-sky-500 px-4 text-sm font-medium text-white hover:bg-sky-600"
        >
          수납 기준등록
        </button>
      </div>

      {listStatus.error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600">
          {listStatus.error}
        </p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">항목코드</th>
              <th className="px-4 py-3 font-medium">항목명</th>
              <th className="px-4 py-3 font-medium">기본가격</th>
              <th className="px-4 py-3 font-medium">분류</th>
              <th className="px-4 py-3 font-medium">보험유형</th>
              <th className="px-4 py-3 font-medium">유효기간</th>
              <th className="px-4 py-3 font-medium">사용여부</th>
              <th className="px-4 py-3 font-medium">관리</th>
            </tr>
          </thead>
          <tbody>
            {listStatus.loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center text-slate-400">
                  로딩중...
                </td>
              </tr>
            ) : list.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center text-slate-400">
                  등록된 수납 기준정보가 없습니다.
                </td>
              </tr>
            ) : (
              list.map((item) => (
                <BillingMasterRow key={item.billingMasterId} billingMaster={item} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
