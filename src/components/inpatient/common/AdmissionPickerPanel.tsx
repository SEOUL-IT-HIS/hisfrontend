"use client";

import type { ReactNode } from "react";
import { Alert, DataTable, type DataTableColumn } from "@/components/common";
import type { AdmissionDTO } from "@/features/inpatient/admissiondischarge/types";
import { formatDateTime } from "@/features/inpatient/dateLimits";

type AdmissionPickerPanelProps = {
  title: string;
  admissions: AdmissionDTO[];
  loading: boolean;
  error: string | null;
  selectedAdmissionId: string | null;
  onSelect: (admissionId: string) => void;
  patientLabel: (patientId: string) => string;
  statusLabel: Record<string, string>;
  emptyMessage?: string;
  /** 제목 오른쪽에 붙일 컨트롤 (예: 퇴원 환자 보기 체크박스) */
  headerExtra?: ReactNode;
};

/**
 * 입원 환자 선택 목록 — 처방요청·간호기록 홈 왼쪽 패널 (응급 접수 목록과 같은 구성)
 * - 행 클릭으로 입원 건을 고르고, 선택된 행은 강조 표시
 */
export default function AdmissionPickerPanel({
  title,
  admissions,
  loading,
  error,
  selectedAdmissionId,
  onSelect,
  patientLabel,
  statusLabel,
  emptyMessage = "No admitted patients.",
  headerExtra,
}: AdmissionPickerPanelProps) {
  const columns: DataTableColumn<AdmissionDTO>[] = [
    {
      key: "patient",
      header: "Patient",
      render: (a) => (
        <span className={`font-medium ${a.status === "DISCHARGED" ? "text-slate-400" : "text-slate-800"}`}>
          {patientLabel(a.patientId)}
        </span>
      ),
    },
    { key: "admitted", header: "Admitted", render: (a) => formatDateTime(a.admissionDate).slice(0, 10) },
    { key: "status", header: "Status", render: (a) => statusLabel[a.status] ?? a.status },
  ];

  return (
    // 부모 높이를 꽉 채우고, 환자가 많으면 표 안에서만 스크롤 (DataTable이 flex-1 + overflow-auto)
    <div className="flex min-h-0 min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <span className="text-sm font-semibold text-slate-800">{title}</span>
        {headerExtra}
      </div>
      {error ? (
        <Alert>{error}</Alert>
      ) : (
        <DataTable
          columns={columns}
          rows={admissions}
          rowKey={(a) => a.admissionId}
          onRowClick={(a) => onSelect(a.admissionId)}
          isRowActive={(a) => a.admissionId === selectedAdmissionId}
          loading={loading}
          loadingMessage="Loading..."
          emptyMessage={emptyMessage}
          minWidthClassName="min-w-0"
        />
      )}
    </div>
  );
}
