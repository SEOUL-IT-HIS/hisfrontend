"use client";

import { Button, Modal } from "@/components/common";
import type { ActiveEmergencyReception } from "@/features/reception/emergencyreception/types";

function formatDateTime(value?: string) {
  if (!value) return "-";
  return value.replace("T", " ").slice(0, 16);
}

type DuplicateActiveReceptionModalProps = {
  open: boolean;
  activeReceptions: ActiveEmergencyReception[];
  onContinue: () => void;
  onCancel: () => void;
};

/**
 * 응급접수 등록 직전, 같은 환자의 진행 중(미퇴실) 응급접수가 있을 때 띄우는 경고 모달.
 * 어떤 경우에도 등록 자체를 막지 않는다 — 계속/취소는 전부 이 모달 안에서 로컬로 결정된다.
 */
export default function DuplicateActiveReceptionModal({
  open,
  activeReceptions,
  onContinue,
  onCancel,
}: DuplicateActiveReceptionModalProps) {
  return (
    <Modal
      open={open}
      title="Possible Duplicate Emergency Reception"
      onClose={onCancel}
      maxWidthClassName="max-w-md"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onContinue}>
            Continue Registration
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">
        This patient already has an active (not yet discharged) emergency
        reception:
      </p>
      <ul className="mt-3 space-y-1 text-sm text-slate-800">
        {activeReceptions.map((reception) => (
          <li
            key={reception.receptionId}
            className="rounded-lg bg-slate-50 px-3 py-2"
          >
            Received at {formatDateTime(reception.receivedAt)}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-slate-600">
        You can continue to register this reception anyway, or cancel.
      </p>
    </Modal>
  );
}
