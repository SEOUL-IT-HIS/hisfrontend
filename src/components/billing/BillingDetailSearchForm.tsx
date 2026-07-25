"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import { searchBillingDetailRequest } from "@/features/billing/searchBillingDetail/slice";

export default function BillingDetailSearchForm() {
  const dispatch = useDispatch<AppDispatch>();
  const [patientName, setPatientName] = useState("");
  const { billingDetails, loading, error } = useSelector(
    (state: RootState) => state.billingDetail,
  );

  function onSearch() {
    dispatch(searchBillingDetailRequest({ patientName }));
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <input
          type="text"
          value={patientName}
          onChange={(event) => setPatientName(event.target.value)}
          placeholder="환자명을 입력하세요"
          className="h-9 flex-1 rounded-lg border border-slate-200 px-3 text-sm"
        />
        <button
          type="button"
          onClick={onSearch}
          className="h-9 rounded-lg bg-sky-500 px-4 text-sm font-medium text-white hover:bg-sky-600"
        >
          환자 검색
        </button>
      </div>

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600">
          {error}
        </p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">환자명</th>
              <th className="px-4 py-3 font-medium">연락처</th>
              <th className="px-4 py-3 font-medium">주소</th>
              <th className="px-4 py-3 font-medium">진료비 항목</th>
              <th className="px-4 py-3 font-medium">금액</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center text-slate-400">
                  조회 중입니다...
                </td>
              </tr>
            ) : billingDetails.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center text-slate-400">
                  검색 결과가 없습니다.
                </td>
              </tr>
            ) : (
              billingDetails.map((detail) => (
                <tr
                  key={detail.billingDetailId}
                  className="border-t border-slate-100 hover:bg-slate-50/80"
                >
                  <td className="px-4 py-3 text-slate-800">{detail.patientName}</td>
                  <td className="px-4 py-3 text-slate-600">{detail.tel}</td>
                  <td className="px-4 py-3 text-slate-600">{detail.addr}</td>
                  <td className="px-4 py-3 text-slate-600">{detail.itemName}</td>
                  <td className="px-4 py-3 text-slate-600">{detail.price}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
