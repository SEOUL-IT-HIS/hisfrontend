"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import {
  fetchImageReceptionsRequest,
  selectImageReceptions,
  selectImageReceptionsLoading,
  selectImageReceptionsError,
  selectImageReception,
} from "@/features/labimaging/imagingorder/slice";
import type { ImageReceptionSummary } from "@/features/labimaging/imagingorder/types";

/**
 * 영상 접수 목록(미일정) — 일정 등록 대상 선택 화면. (laborder 목록과 동일 패턴)
 */
export default function ImageReceptionListForm() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const receptions = useSelector(selectImageReceptions);
  const loading = useSelector(selectImageReceptionsLoading);
  const error = useSelector(selectImageReceptionsError);

  useEffect(() => {
    dispatch(fetchImageReceptionsRequest());
  }, [dispatch]);

  function goRegisterSchedule(reception: ImageReceptionSummary) {
    dispatch(selectImageReception(reception));
    router.push(`/labimaging/imagingschedule/register/${reception.imageReceptionId}`);
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
      ) : null}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">일정 등록 대상(미일정) 영상 접수 목록</p>
        <button
          type="button"
          onClick={() => dispatch(fetchImageReceptionsRequest())}
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
                <tr key={r.imageReceptionId} className="hover:bg-slate-50/60">
                  <td className="px-3 py-2 font-medium text-slate-700">{r.receptionNo}</td>
                  <td className="px-3 py-2 text-slate-600">{r.imageOrderNo}</td>
                  <td className="px-3 py-2 text-slate-600">{r.patientNo}</td>
                  <td className="px-3 py-2 text-slate-600">{r.orderStatusCode}</td>
                  <td className="px-3 py-2 text-slate-600">{r.receptionStatusCode}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/labimaging/imagingorder/receptions/${encodeURIComponent(r.receptionNo)}`}
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
