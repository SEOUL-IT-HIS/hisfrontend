"use client";

import { useState, type ChangeEvent } from "react";
import { Button, FormField, Modal, Select } from "@/components/common";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";

/**
 * 동의 철회 다이얼로그 — 철회사유 선택. UC-IMG-05 (5차 Phase 9-3)
 *
 * ⚠ ReceptionExcludeDialog 와 같은 패턴(Modal + 사유 필수)이다. 사유가 자유입력이 아니라 공통코드
 *   CONSENT_WITHDRAW_CD(기존 admin 그룹)라 Select 를 쓴다.
 * ⚠ 촬영 후 철회도 막지 않는다(D14). 이미 촬영된 영상은 지우지 않고 판독을 이어간다 — 안내 문구로 알린다.
 * ⚠ 실패 메시지는 이 다이얼로그가 아니라 패널에 표시한다. 확인을 누르면 바로 닫히고 처리는 saga 가 한다.
 */
type Props = {
  open: boolean;
  consentLabel: string;
  submitting: boolean;
  onConfirm: (withdrawnReasonCode: string) => void;
  onCancel: () => void;
};

export default function ConsentWithdrawDialog({ open, consentLabel, submitting, onConfirm, onCancel }: Props) {
  const reasons = useCommonCodeOptions("CONSENT_WITHDRAW_CD");
  const [reasonCode, setReasonCode] = useState("");
  const [touched, setTouched] = useState(false);

  const invalid = touched && reasonCode === "";

  function handleChange(e: ChangeEvent<HTMLSelectElement>) {
    setReasonCode(e.target.value);
  }

  function reset() {
    setReasonCode("");
    setTouched(false);
  }

  function handleConfirm() {
    setTouched(true);
    if (reasonCode === "") return;
    onConfirm(reasonCode);
    reset();
  }

  function handleCancel() {
    reset();
    onCancel();
  }

  return (
    <Modal
      open={open}
      title="Withdraw Consent"
      titleId="consent-withdraw-title"
      closeDisabled={submitting}
      onClose={handleCancel}
      maxWidthClassName="max-w-md"
      footer={
        <>
          <Button variant="secondary" onClick={handleCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirm} disabled={submitting || reasons.loading}>
            {submitting ? "Processing..." : "Withdraw"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-700">
          The consent <span className="font-semibold">{consentLabel}</span> will be withdrawn.
          <br />
          New imaging will be blocked until consent is obtained again. Images already acquired are kept and can
          still be read.
        </p>

        <FormField label="Withdrawal Reason" required>
          <Select
            value={reasonCode}
            onChange={handleChange}
            options={reasons.options}
            placeholder={reasons.loading ? "Loading..." : "Select"}
            disabled={submitting || reasons.loading}
          />
          {reasons.error ? <span className="text-xs text-rose-500">{reasons.error}</span> : null}
          {invalid ? <span className="text-xs text-rose-500">Withdrawal reason is required.</span> : null}
        </FormField>
      </div>
    </Modal>
  );
}
