"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  DataTable,
  PageHeader,
  type DataTableColumn,
} from "@/components/common";
import {
  fetchReceptionListRequest,
  selectReceptionList,
  selectReceptionListLoading,
  selectReceptionListError,
} from "@/features/reception/receptionmanagement/slice";
import type { ReceptionListItem } from "@/features/reception/receptionmanagement/types";
import type { AppDispatch } from "@/store/store";
import ReceptionCancelModal from "./ReceptionCancelModal";

const CANCELLED_STATUS = "CANCELLED";
const STATUS_FILTER_ALL = "ALL";

const RECEPTION_TYPE_LABEL: Record<string, string> = {
  INITIAL: "초진",
  REVISIT: "재진",
};

const STATUS_FILTER_OPTIONS = [
  { value: STATUS_FILTER_ALL, label: "전체" },
  { value: "RECEPTION", label: "대기중" },
  { value: CANCELLED_STATUS, label: "취소됨" },
];

function formatDateTime(value?: string) {
  if (!value) return "-";
  return value.replace("T", " ").slice(0, 16);
}

type ReceptionListSectionProps = {
  onSelectReception: (receptionId: string) => void;
};

/**
 * 접수 목록 조회
 * - 접수 등록 성공 시 saga 에서 자동으로 재조회한다.
 */
export default function ReceptionListSection({
  onSelectReception,
}: ReceptionListSectionProps) {
  const dispatch = useDispatch<AppDispatch>();
  const list = useSelector(selectReceptionList);
  const listLoading = useSelector(selectReceptionListLoading);
  const listError = useSelector(selectReceptionListError);
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTER_ALL);
  const [cancelReceptionId, setCancelReceptionId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    dispatch(fetchReceptionListRequest());
  }, [dispatch]);

  const filteredList = useMemo(() => {
    return list.filter((r) => {
      if (statusFilter !== STATUS_FILTER_ALL && r.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [list, statusFilter]);

  const columns: DataTableColumn<ReceptionListItem>[] = [
    {
      key: "receptionDate",
      header: "접수일시",
      render: (r) => formatDateTime(r.receptionDate),
    },
    { key: "patientName", header: "환자명", render: (r) => r.patientName },
    { key: "deptName", header: "진료과", render: (r) => r.deptName },
    { key: "doctorName", header: "담당의", render: (r) => r.doctorName },
    {
      key: "receptionType",
      header: "구분",
      render: (r) => RECEPTION_TYPE_LABEL[r.receptionType] ?? r.receptionType,
    },
    { key: "status", header: "상태", render: (r) => r.status },
    {
      key: "action",
      header: "",
      render: (r) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => onSelectReception(r.receptionId)}
          >
            상세
          </Button>
          <Button
            variant="danger"
            disabled={r.status === CANCELLED_STATUS}
            onClick={() => setCancelReceptionId(r.receptionId)}
          >
            취소
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <PageHeader title="접수 목록" description="접수된 환자 목록입니다." />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex gap-1">
          {STATUS_FILTER_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={statusFilter === option.value ? "primary" : "secondary"}
              onClick={() => setStatusFilter(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {listError ? <Alert variant="error">{listError}</Alert> : null}

      <DataTable
        columns={columns}
        rows={filteredList}
        rowKey={(r) => r.receptionId}
        loading={listLoading}
        loadingMessage="접수 목록을 불러오는 중입니다..."
        emptyMessage="접수된 내역이 없습니다."
      />

      <ReceptionCancelModal
        receptionId={cancelReceptionId}
        onClose={() => setCancelReceptionId(null)}
      />
    </div>
  );
}
