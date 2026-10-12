"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, FormField, Input } from "@/components/common";
import ActorField from "@/components/emergency/common/ActorField";
import DownSelect from "@/components/emergency/common/DownSelect";
import UnconfirmedVerbalNotice from "@/components/emergency/disposition/UnconfirmedVerbalNotice";
import { useActorId } from "@/features/emergency/common/staff";
import { resolveEmergencyMessage } from "@/features/emergency/messages";
import {
  createDispositionRequest,
  fetchDispositionsRequest,
  selectDispositionByReceptionId,
  selectDispositionError,
  selectDispositionLoading,
  selectDispositionSubmitError,
  selectDispositionSubmitting,
} from "@/features/emergency/disposition/slice";
import {
  selectAdmissionsByDisposition,
  selectTransfersByDisposition,
} from "@/features/emergency/disposition/followup/slice";
import {
  DISPOSITION_TYPE_FALLBACK_OPTIONS,
  DISPOSITION_TYPE_GROUP_CODE,
  DISPOSITION_VOID_CODE,
  VOID_REASON_MAX_LENGTH,
  VOID_REASON_TYPE_OPTIONS,
} from "@/features/emergency/disposition/types";
import { selectReceptionListItems } from "@/features/emergency/receptionList/slice";
import {
  fetchAllCommonCodesRequest,
  selectCommonCodeLoaded,
  selectCommonCodesByGroup,
} from "@/features/emergency/commonCode/slice";
import { formatDateTime } from "@/features/emergency/utils";

type DispositionPanelProps = {
  receptionNo: string;
  className?: string;
};

const initialForm = { dispositionType: "", decidedById: "", voidReasonType: "", voidReason: "", keptReceptionId: "" };

/**
 * 응급 퇴실 결정 패널 (UC-DISP-01, Jira UD2-39)
 * - 환자를 고르면 GET /dispositions?receptionId= 로 최신 결정을 불러와 보여준다.
 * - 결정이 없으면 등록 폼을 보여준다.
 * - 결정이 있어도 후속 조치 전(입원요청 없음·거부됨, 전원 소견서 없음)이면 'Change Disposition'으로 바꿀 수 있다.
 *   바꿀 수 있는지는 백엔드가 내려주는 changeable 로 판단한다(병동 회신 대기 중·퇴실 완료면 false).
 */
export default function DispositionPanel({ receptionNo, className = "" }: DispositionPanelProps) {
  const dispatch = useDispatch<AppDispatch>();
  const disposition = useSelector(selectDispositionByReceptionId(receptionNo));
  const loading = useSelector(selectDispositionLoading);
  const error = useSelector(selectDispositionError);
  const submitting = useSelector(selectDispositionSubmitting);
  const submitError = useSelector(selectDispositionSubmitError);
  const commonCodeLoaded = useSelector(selectCommonCodeLoaded);
  const dispositionTypeCodes = useSelector(selectCommonCodesByGroup(DISPOSITION_TYPE_GROUP_CODE));

  const receptionItems = useSelector(selectReceptionListItems);
  const [form, setForm] = useState(initialForm);
  // 퇴실 결정자는 의사 — 직접 안 고르면 로그인한 사람이 의사일 때 그 사람이다
  const decidedById = useActorId(form.decidedById, "DOCTOR");
  const [lastReceptionNo, setLastReceptionNo] = useState(receptionNo);
  // 결정 변경 폼을 열었는지
  const [changing, setChanging] = useState(false);
  const [lastDispositionId, setLastDispositionId] = useState(disposition?.id ?? "");

  // 입원 회신·전원 소견서가 바뀌면 결정 변경 가능 여부(changeable)도 바뀌므로 결정을 다시 불러온다.
  const admissions = useSelector(selectAdmissionsByDisposition(disposition?.id ?? ""));
  const transfers = useSelector(selectTransfersByDisposition(disposition?.id ?? ""));
  const followUpKey = `${admissions[0]?.requestStatusCode ?? ""}|${transfers.length}`;

  useEffect(() => {
    if (receptionNo) {
      dispatch(fetchDispositionsRequest(receptionNo));
    }
  }, [dispatch, receptionNo, followUpKey]);

  useEffect(() => {
    if (!commonCodeLoaded) {
      dispatch(fetchAllCommonCodesRequest());
    }
  }, [dispatch, commonCodeLoaded]);

  // 환자가 바뀌면 입력폼을 초기화한다 (다른 패널들과 동일한 패턴).
  if (receptionNo !== lastReceptionNo) {
    setLastReceptionNo(receptionNo);
    setForm(initialForm);
    setChanging(false);
  }
  // 새 결정이 저장되면(최신 결정 id 가 바뀌면) 변경 폼을 닫는다.
  const currentDispositionId = disposition?.id ?? "";
  if (currentDispositionId !== lastDispositionId) {
    setLastDispositionId(currentDispositionId);
    setForm(initialForm);
    setChanging(false);
  }

  const typeOptions =
    dispositionTypeCodes.length > 0
      ? dispositionTypeCodes
          .filter((code) => code.useYn !== "N")
          .map((code) => ({ value: code.codeValue, label: code.codeName }))
      : [...DISPOSITION_TYPE_FALLBACK_OPTIONS];
  // 결정을 바꿀 때는 지금과 같은 유형은 고를 수 없다(입원이면 재요청을 쓴다)
  const formOptions =
    changing && disposition ? typeOptions.filter((o) => o.value !== disposition.dispositionTypeCode) : typeOptions;

  function typeLabel(code: string): string {
    return typeOptions.find((o) => o.value === code)?.label ?? code;
  }

  // 오접수·중복 접수(06): 사유 유형과 사유가 필수이고, 중복이면 남길 접수를 고를 수 있다
  const voiding = form.dispositionType === DISPOSITION_VOID_CODE;
  const duplicate = form.voidReasonType === "DUPLICATE";
  const voidReady = !voiding || (!!form.voidReasonType && form.voidReason.trim().length > 0);
  const currentPatientId = receptionItems.find((item) => item.receptionId === receptionNo)?.patientId ?? null;
  // 같은 환자의 다른 접수(취소된 접수 제외) — 중복일 때 남길 접수 후보
  const keptOptions = currentPatientId
    ? receptionItems
        .filter((item) => item.patientId === currentPatientId && item.receptionId !== receptionNo && item.careStatusCode !== "CANCELLED")
        .map((item) => ({
          value: item.receptionId,
          label: `${item.patientName ?? "-"} · ${item.receivedAt ? formatDateTime(item.receivedAt) : "-"}`,
        }))
    : [];

  function handleSubmit() {
    if (!form.dispositionType || !decidedById || !receptionNo || !voidReady) return;
    if (voiding) {
      // 되돌릴 수 없는 결정이다 — 접수에 알려 접수가 취소 처리된다(응급 기록은 그대로 남는다)
      const ok = window.confirm(
        "Close this reception as erroneous / duplicate?\n\nThe reception service will be asked to cancel it. " +
          "Clinical records are kept. This cannot be changed afterwards.",
      );
      if (!ok) return;
    }
    dispatch(
      createDispositionRequest({
        encounterId: receptionNo,
        dispositionType: form.dispositionType,
        decidedById,
        ...(voiding
          ? {
              voidReasonType: form.voidReasonType,
              voidReason: form.voidReason.trim(),
              keptReceptionId: duplicate && form.keptReceptionId ? form.keptReceptionId : undefined,
            }
          : {}),
      }),
    );
  }

  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}>
      {/* 퇴실 결정 */}
      <h3 className="mb-3 text-sm font-semibold text-slate-800">Disposition Decision</h3>

      {/* 확정되지 않은 구두처방 안내 — 퇴실을 막지는 않는다 */}
      <UnconfirmedVerbalNotice receptionNo={receptionNo} />

      {loading && !disposition ? (
        // 퇴실 결정을 불러오는 중입니다...
        <p className="py-4 text-center text-sm text-slate-400">Loading disposition...</p>
      ) : error ? (
        <Alert variant="error">{resolveEmergencyMessage(error)}</Alert>
      ) : disposition && !changing ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <span>
            {/* 퇴실 구분: {구분} · {결정일시} */}
            Disposition: {typeLabel(disposition.dispositionTypeCode)} · {formatDateTime(disposition.decidedAt)}
          </span>
          {disposition.dispositionTypeCode === DISPOSITION_VOID_CODE && disposition.voidReason ? (
            // 오접수·중복 접수의 사유
            <span className="w-full text-xs text-emerald-800">
              {VOID_REASON_TYPE_OPTIONS.find((o) => o.value === disposition.voidReasonType)?.label ?? disposition.voidReasonType}
              {" — "}
              {disposition.voidReason}
            </span>
          ) : null}
          {disposition.changeable ? (
            // 결정 변경 (예: 병동이 입원을 거부해 전원·귀가로 바꿀 때)
            <Button type="button" variant="secondary" onClick={() => setChanging(true)}>
              Change Disposition
            </Button>
          ) : null}
        </div>
      ) : (
        <>
          {submitError ? <Alert variant="error">{resolveEmergencyMessage(submitError)}</Alert> : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* 퇴실 구분 */}
            <DownSelect
              label="Disposition Type"
              required
              value={form.dispositionType}
              onChange={(dispositionType) => setForm((prev) => ({ ...prev, dispositionType }))}
              options={formOptions}
              // 선택
              placeholder="Select"
              disabled={submitting}
            />
            {/* 결정자(의사) */}
            <ActorField
              label="Decided By"
              role="DOCTOR"
              required
              value={form.decidedById}
              onChange={(empId) => setForm((prev) => ({ ...prev, decidedById: empId }))}
              disabled={submitting}
            />
          </div>
          {voiding ? (
            <div className="mt-3 space-y-3">
              <Alert variant="info">
                {/* 접수를 닫고 접수 서비스에 알려 접수가 취소 처리합니다. 응급 기록은 그대로 남고 이 결정은 바꿀 수 없습니다. */}
                This closes the reception as erroneous / duplicate and asks the reception service to cancel it. Clinical records
                are kept, and this decision cannot be changed afterwards.
              </Alert>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DownSelect
                  label="Reason Type"
                  required
                  value={form.voidReasonType}
                  onChange={(voidReasonType) =>
                    setForm((prev) => ({ ...prev, voidReasonType, keptReceptionId: voidReasonType === "DUPLICATE" ? prev.keptReceptionId : "" }))
                  }
                  options={[...VOID_REASON_TYPE_OPTIONS]}
                  placeholder="Select"
                  disabled={submitting}
                />
                {duplicate ? (
                  <DownSelect
                    label="Kept Reception"
                    value={form.keptReceptionId}
                    onChange={(keptReceptionId) => setForm((prev) => ({ ...prev, keptReceptionId }))}
                    options={keptOptions}
                    placeholder={keptOptions.length > 0 ? "Select (optional)" : "No other reception of this patient"}
                    disabled={submitting || keptOptions.length === 0}
                  />
                ) : null}
              </div>
              <FormField label="Reason" required hint={`${form.voidReason.length} / ${VOID_REASON_MAX_LENGTH}`}>
                <Input
                  name="voidReason"
                  value={form.voidReason}
                  onChange={(e) => setForm((prev) => ({ ...prev, voidReason: e.target.value }))}
                  maxLength={VOID_REASON_MAX_LENGTH}
                  disabled={submitting}
                  placeholder="e.g. The same patient was registered twice"
                />
              </FormField>
            </div>
          ) : null}
          <div className="mt-3 flex justify-end gap-2">
            {changing ? (
              // 변경 취소
              <Button type="button" variant="ghost" onClick={() => setChanging(false)} disabled={submitting}>
                Cancel
              </Button>
            ) : null}
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !form.dispositionType || !decidedById || !receptionNo || !voidReady}
            >
              {/* 등록 중... / 퇴실 결정 변경 / 퇴실 결정 등록 */}
              {submitting ? "Saving..." : changing ? "Change Disposition" : "Register Disposition"}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
