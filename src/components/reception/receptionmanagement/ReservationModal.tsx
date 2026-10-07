"use client";

import { useState } from "react";
import { Alert, FormActions, FormField, Input, Modal } from "@/components/common";
import { registerReservation } from "@/features/reception/receptionmanagement/api";
import type { ReservationRegisterRequest } from "@/features/reception/receptionmanagement/types";

/** 오늘 날짜 yyyy-MM-dd (로컬 시간 기준) */
function today() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

type ReservationModalProps = {
  open: boolean;
  /** 접수 폼에 입력돼 있는 값 — 날짜/시간만 이 모달에서 받는다 */
  base: Omit<ReservationRegisterRequest, "reservationDate" | "reservationTime"> | null;
  onClose: () => void;
  onReserved: () => void;
};

/**
 * 예약 등록 모달
 * - 접수 폼의 [Reserve] 버튼으로 열린다. 환자/진료과/의사/방문목적은 접수 폼에 입력한 값을 그대로 쓰고,
 *   여기서는 예약일과 예약 시간만 입력받는다.
 */
export default function ReservationModal({
  open,
  base,
  onClose,
  onReserved,
}: ReservationModalProps) {
  const [reservationDate, setReservationDate] = useState(today());
  const [reservationTime, setReservationTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    if (loading) return;
    setError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!base) return;
    if (!reservationDate || !reservationTime) {
      setError("Please enter the reservation date and time.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await registerReservation({ ...base, reservationDate, reservationTime });
      setReservationTime("");
      onReserved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register the reservation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Register Reservation"
      titleId="reservation-modal-title"
      closeDisabled={loading}
      onClose={handleClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-5">
        {error ? <Alert variant="error">{error}</Alert> : null}

        <FormField label="Reservation Date" required htmlFor="reservationDate">
          <Input
            id="reservationDate"
            type="date"
            min={today()}
            value={reservationDate}
            onChange={(e) => setReservationDate(e.target.value)}
          />
        </FormField>

        <FormField label="Reservation Time" required htmlFor="reservationTime">
          <Input
            id="reservationTime"
            type="time"
            value={reservationTime}
            onChange={(e) => setReservationTime(e.target.value)}
          />
        </FormField>

        <FormActions
          onCancel={handleClose}
          submitLabel="Reserve"
          loadingLabel="Reserving…"
          cancelLabel="Cancel"
          loading={loading}
        />
      </form>
    </Modal>
  );
}
