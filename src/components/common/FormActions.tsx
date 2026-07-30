"use client";

import type { ReactNode } from "react";
import Button from "@/components/common/Button";

type FormActionsProps = {
  onCancel: () => void;
  /** submit 버튼 라벨 (등록 / 수정 / 저장) */
  submitLabel: string;
  loading?: boolean;
  loadingLabel?: string;
  cancelLabel?: string;
  /** submit 버튼 비활성 */
  submitDisabled?: boolean;
  className?: string;
  children?: ReactNode;
};

/**
 * 공통 폼 하단 액션
 * - 등록/수정 Modal 하단 [취소] [저장]
 * - import { FormActions } from "@/components/common"
 */
export default function FormActions({
  onCancel,
  submitLabel,
  loading = false,
  loadingLabel = "처리 중…",
  cancelLabel = "취소",
  submitDisabled = false,
  className = "",
  children,
}: FormActionsProps) {
  return (
    <div
      className={`flex justify-end gap-2 border-t border-slate-100 pt-4 ${className}`}
    >
      {children}
      <Button
        type="button"
        variant="secondary"
        onClick={onCancel}
        disabled={loading}
      >
        {cancelLabel}
      </Button>
      <Button type="submit" variant="primary" disabled={loading || submitDisabled}>
        {loading ? loadingLabel : submitLabel}
      </Button>
    </div>
  );
}
