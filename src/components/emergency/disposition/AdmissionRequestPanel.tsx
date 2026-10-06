"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, FormField, Input } from "@/components/common";
import DownSelect from "@/components/emergency/common/DownSelect";
import { resolveEmergencyMessage } from "@/features/emergency/messages";
import { ADMISSION_STATUS, CODE_GROUP, optionLabel, toCodeOptions } from "@/features/emergency/codes";
import {
  createAdmissionRequestAction,
  fetchAdmissionsRequest,
  selectAdmissionsByDisposition,
  selectFollowUpError,
  selectFollowUpLoading,
  selectFollowUpSubmitError,
  selectFollowUpSubmitting,
} from "@/features/emergency/disposition/followup/slice";
import { ADMISSION_STATUS_FALLBACK_OPTIONS } from "@/features/emergency/disposition/followup/types";
import {
  fetchAllCommonCodesRequest,
  selectCommonCodeLoaded,
  selectCommonCodesByGroup,
} from "@/features/emergency/commonCode/slice";
import { formatDateTime } from "@/features/emergency/utils";

/** 희망 병동 선택에서 숨기는 병동 코드(WARD_CD): 06 ICU, 07 ER Observation Unit, 08 Other */
const HIDDEN_WARD_CODES = ["06", "07", "08"];

type AdmissionRequestPanelProps = { dispositionId: string; className?: string };

/**
 * 입원 요청 패널 (UC-DISP-02, Jira UD2-40) — 퇴실 결정이 "입원"일 때만 보인다.
 * - 응급이 병동으로 직접 입원요청을 보내고, 병동이 회신하면(병상 배정/거부) 상태가 바뀐다.
 *   응급은 병동 병상을 건드리지 않고, 응급실 병상 반납도 자동으로 하지 않는다(병상 해제는 Resource 탭).
 * - 진료과/병동은 admin 공통코드 DEPT_CD / WARD_CD. 요청됨·배정 완료 상태의 요청이 있으면 새 요청을 막는다(거부되면 재요청 가능).
 */
export default function AdmissionRequestPanel({ dispositionId, className = "" }: AdmissionRequestPanelProps) {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector(selectAdmissionsByDisposition(dispositionId));
  const loading = useSelector(selectFollowUpLoading);
  const error = useSelector(selectFollowUpError);
  const submitting = useSelector(selectFollowUpSubmitting);
  const submitError = useSelector(selectFollowUpSubmitError);
  const commonCodeLoaded = useSelector(selectCommonCodeLoaded);
  const deptCodes = useSelector(selectCommonCodesByGroup(CODE_GROUP.DEPT));
  const wardCodes = useSelector(selectCommonCodesByGroup(CODE_GROUP.WARD));
  const statusCodes = useSelector(selectCommonCodesByGroup(CODE_GROUP.ADMISSION_STATUS));

  const [form, setForm] = useState({ targetDeptCode: "", wardPrefer: "", note: "" });

  useEffect(() => {
    if (dispositionId) dispatch(fetchAdmissionsRequest(dispositionId));
  }, [dispatch, dispositionId]);

  useEffect(() => {
    if (!commonCodeLoaded) dispatch(fetchAllCommonCodesRequest());
  }, [dispatch, commonCodeLoaded]);

  const deptOptions = toCodeOptions(deptCodes, []);
  const wardOptions = toCodeOptions(wardCodes, []);
  // 병동팀이 더 이상 받지 않는 병동 — 희망 병동 선택에서는 숨긴다. 이미 배정된 병동 이름 표시(wardOptions)에는 그대로 쓴다.
  const selectableWardOptions = wardOptions.filter((o) => !HIDDEN_WARD_CODES.includes(o.value));
  const statusOptions = toCodeOptions(statusCodes, ADMISSION_STATUS_FALLBACK_OPTIONS);
  const latest = items[0];
  // 거부된 요청만 있으면 다시 요청할 수 있다(백엔드 규칙과 동일).
  const canRequest = items.every((a) => a.requestStatusCode === ADMISSION_STATUS.REJECTED);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit() {
    dispatch(
      createAdmissionRequestAction(dispositionId, {
        targetDeptCode: form.targetDeptCode || undefined,
        wardPrefer: form.wardPrefer || undefined,
        note: form.note.trim() || undefined,
      }),
    );
  }

  function statusStyle(code: string): string {
    if (code === ADMISSION_STATUS.BED_ASSIGNED) return "bg-emerald-50 text-emerald-700";
    if (code === ADMISSION_STATUS.REJECTED) return "bg-rose-50 text-rose-700";
    return "bg-amber-50 text-amber-700";
  }

  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}>
      {/* 입원 요청 */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Admission Request</h3>
        <Button type="button" onClick={() => dispatch(fetchAdmissionsRequest(dispositionId))} disabled={loading}>
          {/* 상태 새로고침 */}
          Refresh
        </Button>
      </div>

      {error ? <Alert variant="error">{resolveEmergencyMessage(error)}</Alert> : null}

      {latest ? (
        <div className={`mb-3 rounded-lg px-3 py-2 text-sm ${statusStyle(latest.requestStatusCode)}`}>
          {/* 상태 · 요청 일시 */}
          {optionLabel(statusOptions, latest.requestStatusCode)} · Requested {formatDateTime(latest.requestedAt)}
          {latest.targetDeptCode ? ` · Dept ${optionLabel(deptOptions, latest.targetDeptCode)}` : ""}
          {/* 배정된 병동 — 희망 병동이 아니라 병동의 BED_ASSIGNED 회신값 */}
          {latest.assignedWardCode ? ` · Ward ${optionLabel(wardOptions, latest.assignedWardCode)}` : ""}
          {latest.requestStatusCode === ADMISSION_STATUS.REQUESTED ? (
            <p className="mt-1 text-xs">
              {/* 병동 회신을 기다리는 중입니다. */}
              Waiting for the ward&apos;s reply.
            </p>
          ) : null}
        </div>
      ) : (
        // 아직 입원 요청을 보내지 않았습니다.
        <p className="mb-3 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-400">No admission request sent yet.</p>
      )}

      {canRequest ? (
        <>
          {submitError ? <Alert variant="error">{resolveEmergencyMessage(submitError)}</Alert> : null}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* 진료과 (admin DEPT_CD 가 없으면 코드 직접 입력) */}
            {deptOptions.length > 0 ? (
              <DownSelect
                label="Department"
                value={form.targetDeptCode}
                onChange={(targetDeptCode) => setForm((prev) => ({ ...prev, targetDeptCode }))}
                options={deptOptions}
                placeholder="(optional)"
                allowClear
                disabled={submitting}
              />
            ) : (
              <FormField label="Department">
                <Input name="targetDeptCode" value={form.targetDeptCode} onChange={handleChange} disabled={submitting} maxLength={20} />
              </FormField>
            )}
            {/* 희망 병동 */}
            {wardOptions.length > 0 ? (
              <DownSelect
                label="Preferred Ward"
                value={form.wardPrefer}
                onChange={(wardPrefer) => setForm((prev) => ({ ...prev, wardPrefer }))}
                options={selectableWardOptions}
                placeholder="(optional)"
                allowClear
                disabled={submitting}
              />
            ) : (
              <FormField label="Preferred Ward">
                <Input name="wardPrefer" value={form.wardPrefer} onChange={handleChange} disabled={submitting} maxLength={20} />
              </FormField>
            )}
          </div>
          {/* 요청 메모 (선택, 병동에 전달) */}
          <FormField label="Note" hint="Optional memo for the ward." className="mt-3">
            <Input name="note" value={form.note} onChange={handleChange} disabled={submitting} maxLength={500} />
          </FormField>
          <div className="mt-3 flex justify-end">
            <Button type="button" onClick={handleSubmit} disabled={submitting}>
              {/* 전송 중... / 입원 요청 보내기 */}
              {submitting ? "Sending..." : "Send Admission Request"}
            </Button>
          </div>
        </>
      ) : null}
    </section>
  );
}
