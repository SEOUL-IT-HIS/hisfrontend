"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  ConfirmDialog,
  DataTable,
  PageHeader,
  type DataTableColumn,
} from "@/components/common";
import {
  cancelReservation,
  getReservationList,
} from "@/features/reception/receptionmanagement/api";
import { fetchPatientsByIds } from "@/features/reception/patientmanagement/api";
import type { ReservationItem } from "@/features/reception/receptionmanagement/types";

const VISIT_TYPE_LABEL: Record<string, string> = {
  INITIAL: "Initial Visit",
  REVISIT: "Follow-up Visit",
};

const STATUS_LABEL: Record<string, string> = {
  RESERVED: "Reserved",
  RECEIVED: "Received",
  CANCELLED: "Cancelled",
};

/** 백엔드가 message 에 담아 보내는 에러코드 → 화면 문구 */
const CANCEL_ERROR_MESSAGES: Record<string, string> = {
  RCP012: "The reservation could not be found.",
  RCP013: "This reservation has already been received or cancelled.",
};

type ReservationListSectionProps = {
  /** 값이 바뀔 때마다 목록을 다시 조회한다 (예약 등록·접수 완료 직후) */
  refreshKey: number;
  /** 지금 접수 폼에 옮겨 와 있는 예약 — 그 행은 [Receive] 를 막아 중복 클릭을 방지한다 */
  receivingReservationId: string | null;
  onReceive: (reservation: ReservationItem) => void;
};

/**
 * 예약 목록 (오늘 이후 예약)
 * - [Receive] 를 누르면 그 예약의 환자/진료과/의사/초진·재진/방문목적이 접수 폼으로 옮겨진다.
 *   실제 접수는 접수 폼에서 [Register Reception] 을 눌러야 만들어진다.
 * - 환자명은 reception-service 가 내려주지 않아, 접수 목록과 같이 CB2 batch 조회로 채운다.
 */
export default function ReservationListSection({
  refreshKey,
  receivingReservationId,
  onReceive,
}: ReservationListSectionProps) {
  const [list, setList] = useState<ReservationItem[]>([]);
  // 첫 조회 때만 로딩 표시 — 이후 갱신(refreshKey)은 목록을 그대로 둔 채 조용히 바꾼다.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 취소 확인 중인 예약 / 취소 요청 중 여부 / 목록 갱신용 신호
  const [cancelTarget, setCancelTarget] = useState<ReservationItem | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [localRefresh, setLocalRefresh] = useState(0);

  async function handleConfirmCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await cancelReservation(cancelTarget.reservationId);
      setCancelTarget(null);
      setLocalRefresh((key) => key + 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setError(CANCEL_ERROR_MESSAGES[message] ?? (message || "Failed to cancel the reservation."));
      setCancelTarget(null);
      // 다른 곳에서 이미 접수·취소된 예약일 수 있으니 목록을 다시 불러온다.
      setLocalRefresh((key) => key + 1);
    } finally {
      setCancelling(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const items = await getReservationList();
        let named = items;
        const patientIds = [...new Set(items.map((item) => item.patientId))];
        if (patientIds.length > 0) {
          try {
            const patients = await fetchPatientsByIds(patientIds);
            const nameById = new Map(patients.map((p) => [p.patientId, p.patientName]));
            named = items.map((item) => ({
              ...item,
              patientName: nameById.get(item.patientId) ?? item.patientName,
            }));
          } catch {
            // 이름 조회가 실패해도 예약 목록은 보여준다.
          }
        }
        if (cancelled) return;
        setList(named);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load the reservation list.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey, localRefresh]);

  const columns: DataTableColumn<ReservationItem>[] = [
    {
      key: "reservationDateTime",
      header: "Reservation",
      render: (r) => `${r.reservationDate} ${r.reservationTime}`,
    },
    { key: "patientName", header: "Patient Name", render: (r) => r.patientName },
    { key: "deptName", header: "Department", render: (r) => r.deptName },
    { key: "doctorName", header: "Doctor", render: (r) => r.doctorName },
    {
      key: "visitType",
      header: "Visit",
      render: (r) => VISIT_TYPE_LABEL[r.visitType] ?? r.visitType,
    },
    { key: "status", header: "Status", render: (r) => STATUS_LABEL[r.status] ?? r.status },
    {
      key: "action",
      header: "",
      render: (r) => {
        // 접수됐거나 취소된 예약은 두 버튼 모두 막는다. 접수 폼에 옮겨 와 있는 예약도 막는다(중복 클릭·취소 방지).
        const disabled = r.status !== "RESERVED" || r.reservationId === receivingReservationId;
        return (
          <div className="flex gap-2">
            <Button variant="primary" disabled={disabled} onClick={() => onReceive(r)}>
              Receive
            </Button>
            <Button variant="danger" disabled={disabled} onClick={() => setCancelTarget(r)}>
              Cancel
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <PageHeader
        title="Reservation List"
        description="Click Receive to move a reservation into the reception form."
      />

      {error ? <Alert variant="error">{error}</Alert> : null}

      <DataTable
        columns={columns}
        rows={list}
        rowKey={(r) => r.reservationId}
        loading={loading}
        loadingMessage="Loading reservation list..."
        emptyMessage="No reservations found."
      />

      <ConfirmDialog
        open={cancelTarget !== null}
        title="Cancel Reservation"
        message={`Cancel the reservation of ${cancelTarget?.patientName ?? ""} (${cancelTarget?.reservationDate ?? ""} ${cancelTarget?.reservationTime ?? ""})?`}
        confirmLabel="Cancel Reservation"
        cancelLabel="Back"
        danger
        submitting={cancelling}
        onConfirm={() => void handleConfirmCancel()}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}
