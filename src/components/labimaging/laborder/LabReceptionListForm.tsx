"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, DataTable } from "@/components/common";
import type { DataTableColumn } from "@/components/common";
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
 * - 표는 전역 공통 DataTable 을 쓴다. 로딩/빈 목록 표시는 DataTable 이 담당한다.
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

  const columns: DataTableColumn<LabReceptionSummary>[] = [
    {
      key: "receptionNo",
      header: "접수번호",
      render: (r) => <span className="font-semibold text-slate-700">{r.receptionNo}</span>,
    },
    { key: "labOrderNo", header: "오더번호", render: (r) => r.labOrderNo },
    { key: "patientNo", header: "환자번호", render: (r) => r.patientNo },
    { key: "orderStatusCode", header: "오더상태", render: (r) => r.orderStatusCode },
    {
      key: "receptionStatusCode",
      header: "접수상태",
      render: (r) => r.receptionStatusCode,
    },
    {
      key: "actions",
      header: "액션",
      className: "text-right",
      render: (r) => (
        <div className="flex justify-end gap-2">
          <Link
            href={`/labimaging/laborder/receptions/${encodeURIComponent(r.receptionNo)}`}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            상세
          </Link>
          <Button onClick={() => goRegisterSchedule(r)}>일정 등록</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex min-h-0 flex-col gap-4">
      {error ? <Alert>{error}</Alert> : null}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">일정 등록 대상(미일정) 검사 접수 목록</p>
        <Button
          variant="secondary"
          onClick={() => dispatch(fetchLabReceptionsRequest())}
          disabled={loading}
        >
          새로고침
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={receptions}
        rowKey={(r) => r.labReceptionId}
        loading={loading}
        emptyMessage="일정 등록 대상 접수가 없습니다."
      />
    </div>
  );
}
