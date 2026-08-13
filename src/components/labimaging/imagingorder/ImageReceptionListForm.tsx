"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, DataTable } from "@/components/common";
import type { DataTableColumn } from "@/components/common";
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
 * - 표는 전역 공통 DataTable 을 쓴다. 로딩/빈 목록 표시는 DataTable 이 담당한다.
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

  const columns: DataTableColumn<ImageReceptionSummary>[] = [
    {
      key: "receptionNo",
      header: "접수번호",
      render: (r) => <span className="font-semibold text-slate-700">{r.receptionNo}</span>,
    },
    { key: "imageOrderNo", header: "오더번호", render: (r) => r.imageOrderNo },
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
            href={`/labimaging/imagingorder/receptions/${encodeURIComponent(r.receptionNo)}`}
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
        <p className="text-sm text-slate-500">일정 등록 대상(미일정) 영상 접수 목록</p>
        <Button
          variant="secondary"
          onClick={() => dispatch(fetchImageReceptionsRequest())}
          disabled={loading}
        >
          새로고침
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={receptions}
        rowKey={(r) => r.imageReceptionId}
        loading={loading}
        emptyMessage="일정 등록 대상 접수가 없습니다."
      />
    </div>
  );
}
