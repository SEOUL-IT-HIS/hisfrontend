"use client";

import { useState, type ChangeEvent } from "react";
import { Button, FormField, Input, Modal } from "@/components/common";

/**
 * 접수를 워크리스트에서 뺄 때 사유를 받는 다이얼로그.
 *
 * ⚠ 사유가 필수인 이유 — 기간이 지났다고 자동으로 숨기지 않고 담당자 판단으로 빼기로 한 설계라,
 *   "왜 뺐는지"가 없으면 다음 담당자가 그 판단을 검증할 수 없다.
 *   자동 제외 대신 수동 제외를 택한 장점이 바로 이 기록이다.
 *
 * ⚠ 공통 ConfirmDialog 를 쓰지 않고 Modal 을 직접 쓴다.
 *   ConfirmDialog 는 예/아니오만 받을 수 있어 사유 입력칸을 넣을 수 없다.
 */
type Props = {
  open: boolean;
  receptionNo: string;
  submitting: boolean;
  onConfirm: (exclusionReason: string) => void;
  onCancel: () => void;
};

/**
 * ⚠ 실패 메시지는 이 다이얼로그가 아니라 목록 화면에 표시한다.
 *   확인을 누르면 다이얼로그는 바로 닫히고 처리는 saga 가 이어서 하기 때문이다.
 */
export default function ReceptionExcludeDialog({
  open,
  receptionNo,
  submitting,
  onConfirm,
  onCancel,
}: Props) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);

  const trimmed = reason.trim();
  const invalid = touched && trimmed.length === 0;

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setReason(e.target.value);
  }

  function handleConfirm() {
    setTouched(true);
    if (trimmed.length === 0) return;
    onConfirm(trimmed);
    // 다음에 다른 접수로 다시 열었을 때 이전 사유가 남아 있으면 안 된다.
    setReason("");
    setTouched(false);
  }

  function handleCancel() {
    setReason("");
    setTouched(false);
    onCancel();
  }

  return (
    <Modal
      open={open}
      title="워크리스트에서 제외"
      titleId="reception-exclude-title"
      closeDisabled={submitting}
      onClose={handleCancel}
      maxWidthClassName="max-w-md"
      footer={
        <>
          <Button variant="secondary" onClick={handleCancel} disabled={submitting}>
            취소
          </Button>
          <Button variant="danger" onClick={handleConfirm} disabled={submitting}>
            {submitting ? "처리 중..." : "제외"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-700">
          접수 <span className="font-semibold">{receptionNo}</span> 를 워크리스트에서 뺍니다.
          <br />
          삭제가 아니라 &quot;제외됨&quot; 목록으로 옮기는 것이며, 언제든 다시 복구할 수 있습니다.
        </p>

        <FormField label="제외 사유" required hint="예: 환자 미방문으로 검사 취소 / 오더 착오 접수">
          <Input
            value={reason}
            onChange={handleChange}
            maxLength={200}
            disabled={submitting}
            placeholder="목록 제외 사유를 남겨주세요"
          />
          {invalid ? (
            <span className="text-xs text-rose-500">제외 사유는 필수입니다.</span>
          ) : null}
        </FormField>
      </div>
    </Modal>
  );
}
