"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, DataTable } from "@/components/common";
import { usePatientNames } from "@/features/labimaging/common/hooks/usePatientNames";
import type { DataTableColumn } from "@/components/common";
import {
  fetchImageReceptionsRequest,
  selectImageReceptions,
  selectImageReceptionsLoading,
  selectImageReceptionsError,
  selectImageReception,
} from "@/features/labimaging/imagingorder/slice";
import {
  RECEPTION_FILTER_OPTIONS,
  type ImageReceptionSummary,
  type ReceptionScheduledFilter,
} from "@/features/labimaging/imagingorder/types";

/** 예정일시 표시 — 백엔드가 ISO 문자열로 준다. 일정 미등록이면 "-". */
function formatScheduledAt(scheduledAt?: string) {
  if (!scheduledAt) return "-";
  return scheduledAt.replace("T", " ").slice(0, 16);
}

/**
 * 영상 접수 목록 — 일정 등록/재조정 대상 선택 화면. (laborder 목록과 동일 패턴)
 * - 필터로 "일정 미등록 / 일정 등록됨 / 전체" 를 전환한다. (백엔드 scheduledYn 파라미터)
 * - 표는 전역 공통 DataTable 을 쓴다. 로딩/빈 목록 표시는 DataTable 이 담당한다.
 */
export default function ImageReceptionListForm() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const receptions = useSelector(selectImageReceptions);
  // 목록에 보이는 환자 이름을 한 번에 불러온다. (환자번호를 화면에서 뺀 대체 표시)
  const { names: patientNames } = usePatientNames(receptions.map((r) => r.patientId));
  const loading = useSelector(selectImageReceptionsLoading);
  const error = useSelector(selectImageReceptionsError);

  const [filter, setFilter] = useState<ReceptionScheduledFilter>("N");

  // 필터가 바뀔 때마다 재조회한다. (필터링은 서버가 한다 — 목록이 커져도 안전)
  useEffect(() => {
    dispatch(fetchImageReceptionsRequest(filter));
  }, [dispatch, filter]);

  function goSchedule(reception: ImageReceptionSummary) {
    dispatch(selectImageReception(reception));
    router.push(`/labimaging/imagingschedule/register/${reception.imageReceptionId}`);
  }

  const columns: DataTableColumn<ImageReceptionSummary>[] = [
    {
      key: "receptionNo",
      header: "Reception No.",
      render: (r) => <span className="font-semibold text-slate-700">{r.receptionNo}</span>,
    },
    { key: "imageOrderNo", header: "Order No.", render: (r) => r.imageOrderNo },
    // 환자번호는 화면에서 쓰지 않기로 해서 이름으로 대체했다. (2026-08-25)
    {
      key: "patientName",
      header: "Patient",
      render: (r) => patientNames[r.patientId] ?? "Unknown",
    },
    {
      key: "scheduledAt",
      header: "Scheduled Imaging",
      render: (r) =>
        r.scheduledAt ? (
          formatScheduledAt(r.scheduledAt)
        ) : (
          <span className="text-slate-400">Not scheduled</span>
        ),
    },
    { key: "orderStatusCode", header: "Order Status", render: (r) => r.orderStatusCode },
    {
      key: "receptionStatusCode",
      header: "Reception Status",
      render: (r) => r.receptionStatusCode,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (r) => (
        <div className="flex justify-end gap-2">
          <Link
            href={`/labimaging/imagingorder/receptions/${encodeURIComponent(r.receptionNo)}`}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            Detail
          </Link>
          <Button onClick={() => goSchedule(r)}>
            {r.scheduledAt ? "Reschedule" : "Schedule"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex min-h-0 flex-col gap-4">
      {error ? <Alert>{error}</Alert> : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          {RECEPTION_FILTER_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={filter === opt.value ? "primary" : "secondary"}
              onClick={() => setFilter(opt.value)}
              disabled={loading}
            >
              {opt.label}
            </Button>
          ))}
        </div>
        <Button
          variant="secondary"
          onClick={() => dispatch(fetchImageReceptionsRequest(filter))}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={receptions}
        rowKey={(r) => r.imageReceptionId}
        loading={loading}
        loadingMessage="Loading..."
        emptyMessage={
          filter === "Y"
            ? "No scheduled receptions."
            : filter === "N"
              ? "No receptions awaiting scheduling."
              : "No imaging receptions."
        }
      />
    </div>
  );
}
