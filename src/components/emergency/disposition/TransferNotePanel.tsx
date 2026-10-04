"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, FormField, Select } from "@/components/common";
import ActorField from "@/components/emergency/common/ActorField";
import StaffName from "@/components/emergency/common/StaffName";
import { useActorId } from "@/features/emergency/common/staff";
import { resolveEmergencyMessage } from "@/features/emergency/messages";
import { CODE_GROUP, optionLabel, toCodeOptions } from "@/features/emergency/codes";
import {
  createTransferNoteAction,
  fetchTransfersRequest,
  selectFollowUpError,
  selectFollowUpSubmitError,
  selectFollowUpSubmitting,
  selectTransfersByDisposition,
} from "@/features/emergency/disposition/followup/slice";
import { TRANSFER_HOSPITAL_FALLBACK_OPTIONS } from "@/features/emergency/disposition/followup/types";
import {
  fetchAllCommonCodesRequest,
  selectCommonCodeLoaded,
  selectCommonCodesByGroup,
} from "@/features/emergency/commonCode/slice";
import { formatDateTime } from "@/features/emergency/utils";

type TransferNotePanelProps = { dispositionId: string; className?: string };

const initialForm = { targetHospitalCode: "", content: "", writtenById: "" };

/**
 * 전원 소견서 패널 (UC-DISP-03, Jira UD2-41) — 퇴실 결정이 "전원"일 때만 보인다.
 * - 진단명·응급실 투약 내역·전원 사유를 자유 서식으로 적는다(투약 내역은 GR2 처방 조회를 참고해 직접 기재).
 * - 대상 병원은 admin 공통코드 TRANSFER_HOSPITAL_CD(없으면 폴백 샘플 목록).
 */
export default function TransferNotePanel({ dispositionId, className = "" }: TransferNotePanelProps) {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector(selectTransfersByDisposition(dispositionId));
  const error = useSelector(selectFollowUpError);
  const submitting = useSelector(selectFollowUpSubmitting);
  const submitError = useSelector(selectFollowUpSubmitError);
  const commonCodeLoaded = useSelector(selectCommonCodeLoaded);
  const hospitalCodes = useSelector(selectCommonCodesByGroup(CODE_GROUP.TRANSFER_HOSPITAL));

  const [form, setForm] = useState(initialForm);
  const [lastCount, setLastCount] = useState(0);
  // 소견서 작성자는 의사 — 직접 안 고르면 로그인한 사람이 의사일 때 그 사람이다
  const writtenById = useActorId(form.writtenById, "DOCTOR");

  useEffect(() => {
    if (dispositionId) dispatch(fetchTransfersRequest(dispositionId));
  }, [dispatch, dispositionId]);

  useEffect(() => {
    if (!commonCodeLoaded) dispatch(fetchAllCommonCodesRequest());
  }, [dispatch, commonCodeLoaded]);

  if (items.length > lastCount) {
    setLastCount(items.length);
    if (!submitting && !submitError) setForm(initialForm);
  } else if (items.length < lastCount) {
    setLastCount(items.length);
  }

  const hospitalOptions = toCodeOptions(hospitalCodes, TRANSFER_HOSPITAL_FALLBACK_OPTIONS);
  const canSubmit =
    !submitting && !!form.targetHospitalCode && !!form.content.trim() && !!writtenById;

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit() {
    if (!canSubmit) return;
    dispatch(
      createTransferNoteAction(dispositionId, {
        targetHospitalCode: form.targetHospitalCode,
        content: form.content.trim(),
        writtenById,
      }),
    );
  }

  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}>
      {/* 전원 소견서 */}
      <h3 className="mb-3 text-sm font-semibold text-slate-800">Transfer Note</h3>

      {error ? <Alert variant="error">{resolveEmergencyMessage(error)}</Alert> : null}

      {items.length > 0 ? (
        <ul className="mb-4 space-y-2">
          {items.map((item) => (
            <li key={item.id} className="rounded-lg bg-slate-50 p-3 text-sm">
              <p className="text-xs font-medium text-sky-600">
                {/* 대상 병원 */}
                To: {optionLabel(hospitalOptions, item.targetHospitalCode)}
              </p>
              <p className="whitespace-pre-wrap text-slate-800">{item.content}</p>
              <p className="mt-1 text-xs text-slate-400">
                <StaffName empId={item.writtenById} /> · {formatDateTime(item.writtenAt)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        // 작성된 전원 소견서가 없습니다.
        <p className="mb-4 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-400">No transfer note written yet.</p>
      )}

      {submitError ? <Alert variant="error">{resolveEmergencyMessage(submitError)}</Alert> : null}

      <div className="flex flex-wrap gap-3">
        {/* 대상 병원 */}
        <FormField label="Destination Hospital" required className="w-[280px]">
          <Select
            name="targetHospitalCode"
            value={form.targetHospitalCode}
            onChange={handleChange}
            options={hospitalOptions}
            placeholder="Select"
            disabled={submitting}
          />
        </FormField>
        {/* 작성자(의사) */}
        <ActorField
          label="Written By"
          role="DOCTOR"
          required
          value={form.writtenById}
          onChange={(empId) => setForm((prev) => ({ ...prev, writtenById: empId }))}
          disabled={submitting}
          className="w-[220px]"
        />
      </div>
      {/* 소견 내용 */}
      <FormField label="Note Content" required hint="Diagnosis, treatment given in the ER, reason for transfer." className="mt-3">
        <textarea
          name="content"
          value={form.content}
          onChange={handleChange}
          disabled={submitting}
          maxLength={4000}
          className="w-full min-h-[96px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      </FormField>
      <div className="mt-3 flex justify-end">
        <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
          {/* 저장 중... / 전원 소견서 작성 */}
          {submitting ? "Saving..." : "Write Transfer Note"}
        </Button>
      </div>
    </section>
  );
}
