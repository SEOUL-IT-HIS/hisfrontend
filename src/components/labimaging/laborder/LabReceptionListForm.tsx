"use client";

import { useEffect, useState } from "react";
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
import {
  RECEPTION_FILTER_OPTIONS,
  type LabReceptionSummary,
  type ReceptionScheduledFilter,
} from "@/features/labimaging/laborder/types";

/** 예정일시 표시 — 백엔드가 ISO 문자열로 준다. 일정 미등록이면 "-". */
function formatScheduledAt(scheduledAt?: string) {
  if (!scheduledAt) return "-";
  return scheduledAt.replace("T", " ").slice(0, 16);
}

/**
 * 검사 접수 목록 — 일정 등록/재조정 대상 선택 화면.
 * - 필터로 "일정 미등록 / 일정 등록됨 / 전체" 를 전환한다. (백엔드 scheduledYn 파라미터)
 * - 일정이 잡힌 접수도 볼 수 있어야 재조정(재등록) 화면으로 갈 수 있다.
 *   미등록만 보이던 시절에는 재등록 기능에 도달할 경로가 없었다.
 * - [일정 등록/재등록]: 선택 접수를 store 에 저장(재조회 없이 컨텍스트 유지) 후 일정 화면으로 push.
 * - 표는 전역 공통 DataTable 을 쓴다. 로딩/빈 목록 표시는 DataTable 이 담당한다.
 */
export default function LabReceptionListForm() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const receptions = useSelector(selectLabReceptions);
  const loading = useSelector(selectLabReceptionsLoading);
  const error = useSelector(selectLabReceptionsError);

  const [filter, setFilter] = useState<ReceptionScheduledFilter>("N");

  // 필터가 바뀔 때마다 재조회한다. (필터링은 서버가 한다 — 목록이 커져도 안전)
  useEffect(() => {
    dispatch(fetchLabReceptionsRequest(filter));
  }, [dispatch, filter]);

  function goSchedule(reception: LabReceptionSummary) {
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
    {
      key: "scheduledAt",
      header: "검사 예정일시",
      render: (r) =>
        r.scheduledAt ? (
          formatScheduledAt(r.scheduledAt)
        ) : (
          <span className="text-slate-400">미등록</span>
        ),
    },
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
          {/* 일정 유무에 따라 버튼 문구가 갈린다. 실제 동작(화면 이동)은 같고,
              일정 화면에서 신규/재등록 모드를 고르게 된다. */}
          <Button onClick={() => goSchedule(r)}>
            {r.scheduledAt ? "일정 재등록" : "일정 등록"}
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
          onClick={() => dispatch(fetchLabReceptionsRequest(filter))}
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
        emptyMessage={
          filter === "Y"
            ? "일정이 등록된 접수가 없습니다."
            : filter === "N"
              ? "일정 등록 대상 접수가 없습니다."
              : "검사 접수가 없습니다."
        }
      />
    </div>
  );
}
