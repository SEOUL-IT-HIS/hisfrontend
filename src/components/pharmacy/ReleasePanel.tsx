"use client";

import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  cancelReleaseRequest,
  registerReleaseRequest,
} from "@/features/pharmacy/slice";
import type { RootState } from "@/store/store";
import { Button, FormField, Input, Panel, Select } from "@/components/common";
import type { ReleaseInfo } from "@/features/pharmacy/types";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";

type ReleasePanelProps = {
  prescriptionLinkId: string;
  release: ReleaseInfo | null;
};

/**
 * 불출/불출취소 (HL2-20, HL2-21).
 * 조제완료(DISPENSED) 상태의 처방전 상세 페이지에서만 보여준다.
 * 불출을 한 번 취소하면(DB 유니크 제약 UQ_MEDICATION_RELEASE_1) 같은 조제 건으로는
 * 다시 불출할 수 없어, CANCELLED 상태면 버튼 없이 안내만 보여준다.
 */
export default function ReleasePanel({ prescriptionLinkId, release }: ReleasePanelProps) {
  const dispatch = useDispatch();
  const loading = useSelector((state: RootState) => state.pharmacy.releaseLoading);
  const error = useSelector((state: RootState) => state.pharmacy.releaseError);
  const [recipientTypeCd, setRecipientTypeCd] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  // ADM 공통코드 PHM_RECIPIENT_TYPE(01=환자/02=보호자/03=병동)을 그대로 가져와 드롭다운을 채운다.
  const { options: recipientTypeOptions } = useCommonCodeOptions("PHM_RECIPIENT_TYPE");
  const recipientTypeLabelByCd = useMemo(
    () => new Map(recipientTypeOptions.map((opt) => [opt.value, opt.label])),
    [recipientTypeOptions]
  );

  const handleRelease = () => {
    if (!recipientTypeCd) return;
    dispatch(registerReleaseRequest({ prescriptionLinkId, recipientTypeCd }));
  };

  const handleCancelRelease = () => {
    if (!release || !cancelReason.trim()) return;
    dispatch(
      cancelReleaseRequest({
        medicationReleaseId: release.medicationReleaseId,
        reason: cancelReason.trim(),
        prescriptionLinkId,
      })
    );
    setCancelReason("");
  };

  return (
    <Panel className="p-5">
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-slate-700">Release</h3>

        {!release && (
          <>
            <FormField label="Recipient Type" required>
              <Select
                options={recipientTypeOptions}
                placeholder="Select recipient type"
                value={recipientTypeCd}
                onChange={(e) => setRecipientTypeCd(e.target.value)}
              />
            </FormField>
            <div className="flex justify-end">
              <Button onClick={handleRelease} disabled={loading || !recipientTypeCd}>
                Release
              </Button>
            </div>
          </>
        )}

        {release && release.releaseStatusCd === "RELEASED" && (
          <>
            <p className="text-sm text-slate-700">
              Released to{" "}
              <span className="font-semibold">
                {recipientTypeLabelByCd.get(release.recipientTypeCd) ?? release.recipientTypeCd}
              </span>
              .
            </p>
            <FormField label="Cancel Release Reason" required>
              <Input
                type="text"
                placeholder="Cancel Release Reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </FormField>
            <div className="flex justify-end">
              <Button
                variant="danger"
                onClick={handleCancelRelease}
                disabled={loading || !cancelReason.trim()}
              >
                Cancel Release
              </Button>
            </div>
          </>
        )}

        {release && release.releaseStatusCd === "CANCELLED" && (
          <p className="text-sm text-slate-400">
            Release was cancelled. This dispensing cannot be released again.
          </p>
        )}

        {error && <p className="text-sm text-rose-500">{error}</p>}
      </div>
    </Panel>
  );
}
