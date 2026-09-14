"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  DataTable,
  PageHeader,
  type DataTableColumn,
} from "@/components/common";
import {
  selectCancelLoading,
  selectCancelError,
} from "@/features/reception/receptionmanagement/slice";
import {
  fetchEmergencyReceptionListRequest,
  selectEmergencyReceptionList,
  selectEmergencyReceptionListLoading,
  selectEmergencyReceptionListError,
} from "@/features/reception/emergencyreception/slice";
import type { EmergencyReceptionListItem } from "@/features/reception/emergencyreception/types";
import type { AppDispatch } from "@/store/store";
import ReceptionCancelModal from "@/components/reception/receptionmanagement/ReceptionCancelModal";

const CANCELLED_STATUS = "CANCELLED";
const STATUS_FILTER_ALL = "ALL";

const STATUS_FILTER_OPTIONS = [
  { value: STATUS_FILTER_ALL, label: "All" },
  { value: "RECEPTION", label: "Waiting" },
  { value: CANCELLED_STATUS, label: "Cancelled" },
];

function formatDateTime(value?: string) {
  if (!value) return "-";
  return value.replace("T", " ").slice(0, 16);
}

type EmergencyReceptionListSectionProps = {
  onSelectReception: (receptionId: string) => void;
};

/**
 * 응급 접수 목록 (응급접수홈 전용)
 * - reception 홈 목록(GET /api/reception)과 분리된 GET /api/reception/emergency 를 사용한다.
 *   백엔드가 당일·응급·취소제외로 이미 걸러주고 진료과명/의사명/환자명도 채워서 내려준다.
 * - 응급 접수 등록 성공 시 saga 에서 목록을 자동 재조회하고, 여기서도 취소 완료 후 재조회한다.
 */
export default function EmergencyReceptionListSection({
  onSelectReception,
}: EmergencyReceptionListSectionProps) {
  const dispatch = useDispatch<AppDispatch>();
  const list = useSelector(selectEmergencyReceptionList);
  const listLoading = useSelector(selectEmergencyReceptionListLoading);
  const listError = useSelector(selectEmergencyReceptionListError);
  const cancelLoading = useSelector(selectCancelLoading);
  const cancelError = useSelector(selectCancelError);
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTER_ALL);
  const [cancelReceptionId, setCancelReceptionId] = useState<string | null>(
    null,
  );

  const prevCancelLoading = useRef(cancelLoading);

  useEffect(() => {
    dispatch(fetchEmergencyReceptionListRequest());
  }, [dispatch]);

  // 취소 요청이 끝나면(true → false) 에러가 없을 때 목록을 재조회한다.
  useEffect(() => {
    if (prevCancelLoading.current && !cancelLoading && !cancelError) {
      dispatch(fetchEmergencyReceptionListRequest());
    }
    prevCancelLoading.current = cancelLoading;
  }, [cancelLoading, cancelError, dispatch]);

  const filteredList = useMemo(() => {
    return list.filter((r) => {
      if (statusFilter !== STATUS_FILTER_ALL && r.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [list, statusFilter]);

  const columns: DataTableColumn<EmergencyReceptionListItem>[] = [
    {
      key: "receivedAt",
      header: "Reception Date",
      render: (r) => formatDateTime(r.receivedAt),
    },
    { key: "patientName", header: "Patient Name", render: (r) => r.patientName },
    { key: "ktasLevel", header: "KTAS", render: (r) => r.ktasLevel ?? "-" },
    { key: "deptName", header: "Department", render: (r) => r.deptName },
    { key: "doctorName", header: "Doctor", render: (r) => r.doctorName },
    { key: "status", header: "Status", render: (r) => r.status },
    {
      key: "action",
      header: "",
      render: (r) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => onSelectReception(r.receptionId)}
          >
            Details
          </Button>
          <Button
            variant="danger"
            disabled={r.status === CANCELLED_STATUS}
            onClick={() => setCancelReceptionId(r.receptionId)}
          >
            Cancel
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <PageHeader
        title="Emergency Reception List"
        description="List of registered emergency receptions."
      />

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
        loadingMessage="Loading reception list..."
        emptyMessage="No emergency receptions found."
      />

      <ReceptionCancelModal
        receptionId={cancelReceptionId}
        onClose={() => setCancelReceptionId(null)}
      />
    </div>
  );
}
