"use client";

import Button from "@/components/common/Button";
import Modal from "@/components/common/Modal";

type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 삭제 확인이면 danger */
  danger?: boolean;
  submitting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * 공통 확인 다이얼로그
 * - 삭제 확인 등 사용자 의사 확인에 사용
 */
export default function ConfirmDialog({
  open,
  title = "확인",
  message,
  confirmLabel = "확인",
  cancelLabel = "취소",
  danger = false,
  submitting = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      titleId="confirm-dialog-title"
      closeDisabled={submitting}
      onClose={onCancel}
      maxWidthClassName="max-w-md"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting ? "처리 중..." : confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-700">{message}</p>
    </Modal>
  );
}
