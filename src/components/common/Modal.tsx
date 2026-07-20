"use client";

import type { ReactNode } from "react";
import Button from "@/components/common/Button";

type ModalProps = {
  open: boolean;
  title: string;
  titleId?: string;
  /** 저장 중이면 닫기 비활성 */
  closeDisabled?: boolean;
  onClose: () => void;
  children: ReactNode;
  /** 모달 너비 */
  maxWidthClassName?: string;
  footer?: ReactNode;
};

/**
 * 공통 모달
 * - 등록/수정 폼을 children 으로 넣고 사용
 */
export default function Modal({
  open,
  title,
  titleId = "common-modal-title",
  closeDisabled = false,
  onClose,
  children,
  maxWidthClassName = "max-w-lg",
  footer,
}: ModalProps) {
  if (!open) {
    return null;
  }

  function handleClose() {
    if (closeDisabled) {
      return;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`max-h-[90vh] w-full overflow-y-auto rounded-xl bg-white shadow-xl ${maxWidthClassName}`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 id={titleId} className="text-base font-semibold text-slate-800">
            {title}
          </h2>
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={closeDisabled}
            className="h-8 px-2"
            aria-label="닫기"
          >
            ✕
          </Button>
        </div>

        <div className="px-5 py-4">{children}</div>

        {footer ? (
          <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
