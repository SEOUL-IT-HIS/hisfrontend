"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  cancelReleaseRequest,
  registerReleaseRequest,
} from "@/features/pharmacy/slice";
import type { RootState } from "@/store/store";
import { Button, FormField, Input, Panel, Select } from "@/components/common";
import type { ReleaseInfo } from "@/features/pharmacy/types";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import { useEmpNames } from "@/features/emp/hooks/useEmpNames";
import { fetchEmpApi } from "@/features/emp/api/empApi";
import type { Emp } from "@/features/emp/types/empTypes";
import { useActor } from "@/features/pharmacy/useActor";

type ReleasePanelProps = {
  prescriptionLinkId: string;
  release: ReleaseInfo | null;
  /** 이미 반납이 기록된 불출이면 true — 이 경우 서버가 불출취소를 막는다(PHM026) */
  hasReturns: boolean;
};

// ADM 공통코드 PHM_RECIPIENT_TYPE 값 — 유형에 따라 받은 사람 입력이 달라진다
const RECIPIENT_GUARDIAN = "02";
const RECIPIENT_WARD = "03";

/**
 * 불출/불출취소 (HL2-20, HL2-21).
 * 조제완료(DISPENSED) 상태의 처방전 상세 페이지에서만 보여준다.
 * 불출을 한 번 취소하면(DB 유니크 제약 UQ_MEDICATION_RELEASE_1) 같은 조제 건으로는
 * 다시 불출할 수 없어, CANCELLED 상태면 버튼 없이 안내만 보여준다.
 *
 * 처리자는 로그인한 약사로 자동 기록된다. 받은 사람은 유형별로 받는다 — 환자 본인은 따로 없고,
 * 보호자는 이름을 직접 입력, 병동은 시스템에 등록된 병동 직원 중에서 고른다.
 */
export default function ReleasePanel({ prescriptionLinkId, release, hasReturns }: ReleasePanelProps) {
  const dispatch = useDispatch();
  const { actorId, actorName } = useActor();
  const loading = useSelector((state: RootState) => state.pharmacy.releaseLoading);
  const error = useSelector((state: RootState) => state.pharmacy.releaseError);
  const [recipientTypeCd, setRecipientTypeCd] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  // ADM 공통코드 PHM_RECIPIENT_TYPE(01=환자/02=보호자/03=병동)을 그대로 가져와 드롭다운을 채운다.
  const { options: recipientTypeOptions } = useCommonCodeOptions("PHM_RECIPIENT_TYPE");
  const recipientTypeLabelByCd = useMemo(
    () => new Map(recipientTypeOptions.map((opt) => [opt.value, opt.label])),
    [recipientTypeOptions]
  );
  const { names: empNames } = useEmpNames();

  // 병동 직원 선택 목록 — 병동을 고른 때만 불러온다
  const [employees, setEmployees] = useState<Emp[]>([]);
  useEffect(() => {
    if (recipientTypeCd !== RECIPIENT_WARD || employees.length > 0) return;
    let ignore = false;
    fetchEmpApi()
      .then((list) => {
        if (!ignore) setEmployees(list);
      })
      .catch(() => {
        // 목록을 못 불러오면 선택지가 비어 있어 병동 불출 버튼이 비활성으로 남는다.
      });
    return () => {
      ignore = true;
    };
  }, [recipientTypeCd, employees.length]);
  const employeeOptions = employees.map((employee) => ({
    value: employee.empId,
    label: `${employee.empName} (${employee.empNo})`,
  }));

  const recipientReady =
    recipientTypeCd !== "" &&
    (recipientTypeCd !== RECIPIENT_GUARDIAN || guardianName.trim() !== "") &&
    (recipientTypeCd !== RECIPIENT_WARD || receiverId !== "");

  const handleRelease = () => {
    if (!actorId || !recipientReady) return;
    dispatch(
      registerReleaseRequest({
        prescriptionLinkId,
        recipientTypeCd,
        releasedById: actorId,
        receiverId: recipientTypeCd === RECIPIENT_WARD ? receiverId : undefined,
        guardianName: recipientTypeCd === RECIPIENT_GUARDIAN ? guardianName.trim() : undefined,
      })
    );
  };

  const handleCancelRelease = () => {
    if (!release || !actorId || !cancelReason.trim()) return;
    dispatch(
      cancelReleaseRequest({
        medicationReleaseId: release.medicationReleaseId,
        reason: cancelReason.trim(),
        actorId,
        prescriptionLinkId,
      })
    );
    setCancelReason("");
  };

  return (
    <Panel className="shrink-0 p-5">
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-slate-700">Release</h3>

        {!release && (
          <>
            <p className="text-xs text-slate-400">Released by: {actorName || "-"} (signed-in user)</p>
            <FormField label="Recipient Type" required>
              <Select
                options={recipientTypeOptions}
                placeholder="Select recipient type"
                value={recipientTypeCd}
                onChange={(e) => {
                  setRecipientTypeCd(e.target.value);
                  setGuardianName("");
                  setReceiverId("");
                }}
              />
            </FormField>
            {recipientTypeCd === RECIPIENT_GUARDIAN && (
              <FormField label="Guardian Name" required>
                <Input
                  type="text"
                  placeholder="Guardian who received the medication"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                />
              </FormField>
            )}
            {recipientTypeCd === RECIPIENT_WARD && (
              <FormField label="Receiving Ward Staff" required>
                <Select
                  options={employeeOptions}
                  placeholder="Select the ward staff who received it"
                  value={receiverId}
                  onChange={(e) => setReceiverId(e.target.value)}
                />
              </FormField>
            )}
            <div className="flex justify-end">
              <Button onClick={handleRelease} disabled={loading || !actorId || !recipientReady}>
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
              {release.guardianName && <> (guardian: {release.guardianName})</>}
              {release.receivedById && <> (received by: {empNames[release.receivedById] ?? release.receivedById})</>}
              .
            </p>
            <p className="text-xs text-slate-400">
              {release.releasedAt.replace("T", " ").slice(0, 19)}
              {release.releasedById && <> · by {empNames[release.releasedById] ?? release.releasedById}</>}
            </p>
            {hasReturns ? (
              <p className="text-sm text-slate-400">
                A return has been recorded for this release, so it can no longer be cancelled.
              </p>
            ) : (
              <>
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
                    disabled={loading || !actorId || !cancelReason.trim()}
                  >
                    Cancel Release
                  </Button>
                </div>
              </>
            )}
          </>
        )}

        {release && release.releaseStatusCd === "CANCELLED" && (
          <p className="text-sm text-slate-400">
            Release was cancelled. This dispensing cannot be released again — cancel the dispensing and dispense again.
          </p>
        )}

        {error && <p className="text-sm text-rose-500">{error}</p>}
      </div>
    </Panel>
  );
}
