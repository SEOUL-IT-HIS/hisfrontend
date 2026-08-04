"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import {
  fetchLabReceptionsRequest,
  selectLabReceptions,
  selectLabReceptionsLoading,
  selectLabReceptionsError,
  selectLabReception,
} from "@/features/labimaging/laborder/slice";
import type { LabReceptionSummary } from "@/features/labimaging/laborder/types";

/**
 * 검사 접수 목록(미일정) — 일정 등록 대상 선택 화면.
 * - 진입 시 목록 fetch. 각 행에서 [상세] 또는 [일정 등록] 으로 이동한다.
 * - [일정 등록]: 선택 접수를 store 에 저장(재조회 없이 컨텍스트 유지) 후 일정등록 화면으로 push.
 */
export default function LabReceptionListForm() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const receptions = useSelector(selectLabReceptions);
  const loading = useSelector(selectLabReceptionsLoading);
  const error = useSelector(selectLabReceptionsError);

  useEffect(() => {
    dispatch(fetchLabReceptionsRequest());
  }, [dispatch]);

  function goRegisterSchedule(reception: LabReceptionSummary) {
    dispatch(selectLabReception(reception));
    router.push(`/labimaging/labschedule/register/${reception.labReceptionId}`);
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
      ) : null}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">일정 등록 대상(미일정) 검사 접수 목록</p>
        <button
          type="button"
          onClick={() => dispatch(fetchLabReceptionsRequest())}
          disabled={loading}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          새로고침
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-100">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">접수번호</th>
              <th className="px-3 py-2 font-medium">오더번호</th>
              <th className="px-3 py-2 font-medium">환자번호</th>
              <th className="px-3 py-2 font-medium">오더상태</th>
              <th className="px-3 py-2 font-medium">접수상태</th>
              <th className="px-3 py-2 text-right font-medium">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                  불러오는 중…
                </td>
              </tr>
            ) : receptions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                  일정 등록 대상 접수가 없습니다.
                </td>
              </tr>
            ) : (
              receptions.map((r) => (
                <tr key={r.labReceptionId} className="hover:bg-slate-50/60">
                  <td className="px-3 py-2 font-medium text-slate-700">{r.receptionNo}</td>
                  <td className="px-3 py-2 text-slate-600">{r.labOrderNo}</td>
                  <td className="px-3 py-2 text-slate-600">{r.patientNo}</td>
                  <td className="px-3 py-2 text-slate-600">{r.orderStatusCode}</td>
                  <td className="px-3 py-2 text-slate-600">{r.receptionStatusCode}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/labimaging/laborder/receptions/${encodeURIComponent(r.receptionNo)}`}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
                      >
                        상세
                      </Link>
                      <button
                        type="button"
                        onClick={() => goRegisterSchedule(r)}
                        className="rounded-lg bg-sky-500 px-3 py-1 text-xs font-medium text-white hover:bg-sky-600"
                      >
                        일정 등록
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
