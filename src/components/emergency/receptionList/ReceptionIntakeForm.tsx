"use client";

import { useState, type ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, FormField, Input, Select } from "@/components/common";
import { resolveEmergencyMessage } from "@/features/emergency/messages";
import {
  createReceptionIntakeRequest,
  selectLastReceptionIntake,
  selectReceptionIntakeSubmitError,
  selectReceptionIntakeSubmitting,
} from "@/features/emergency/receptionIntake/slice";
import { ARRIVAL_PATH_OPTIONS } from "@/features/emergency/receptionIntake/types";
import { formatDateTime } from "@/features/emergency/utils";

function arrivalPathLabel(value: string): string {
  return ARRIVAL_PATH_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

/** <input type="datetime-local"> 기본값 — 지금 이 순간을 "YYYY-MM-DDTHH:mm"으로. */
function nowForDateTimeLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const initialForm = {
  receptionId: "",
  patientId: "",
  patientName: "",
  arrivalPath: "",
  receivedAt: nowForDateTimeLocal(),
  memo: "",
  chiefComplaintRaw: "",
};

/**
 * 응급접수 정보 수신 폼 (UC-CARE-01 보조 / Jira UD2-14)
 *
 * 원래 RCP(원무접수) 시스템이 접수 발생 시 자동 호출하도록 만들어진 API를,
 * RCP 연동 전이라 이 화면에서 수동으로 대신 호출하는 용도다.
 * 주의(CareServiceImpl.getPatients 확인): 접수목록은 여전히 KTAS 기록 기준으로 만들어져서,
 * 여기서 등록해도 "KTAS 없는 신규 접수 건"은 목록에 안 뜬다. 이미 KTAS가 있는 접수번호로
 * 등록하면 그 사람의 환자명/접수시간만 실제값으로 채워준다.
 */
export default function ReceptionIntakeForm() {
  const dispatch = useDispatch<AppDispatch>();
  const submitting = useSelector(selectReceptionIntakeSubmitting);
  const submitError = useSelector(selectReceptionIntakeSubmitError);
  const lastIntake = useSelector(selectLastReceptionIntake);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  const canSubmit =
    form.receptionId.trim() &&
    form.patientId.trim() &&
    form.patientName.trim() &&
    form.arrivalPath.trim() &&
    form.receivedAt.trim();

  function handleSubmit() {
    if (!canSubmit) return;
    dispatch(
      createReceptionIntakeRequest({
        receptionId: form.receptionId.trim(),
        patientId: form.patientId.trim(),
        patientName: form.patientName.trim(),
        arrivalPath: form.arrivalPath.trim(),
        receivedAt: `${form.receivedAt}:00`,
        memo: form.memo.trim() || undefined,
        chiefComplaintRaw: form.chiefComplaintRaw.trim() || undefined,
      }),
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border border-dashed border-slate-300 px-4 py-2 text-left text-sm text-slate-500 hover:border-slate-400 hover:text-slate-700"
      >
        {/* + 새 접수 등록 */}
        + New Reception Intake
      </button>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-1 flex items-center justify-between">
        {/* 응급접수 정보 등록 */}
        <h3 className="text-sm font-semibold text-slate-800">Reception Intake</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-400 hover:text-slate-600">
          {/* 닫기 */}
          Close
        </button>
      </div>
      <p className="mb-3 text-xs text-slate-400">
        {/*
          RCP 연동 전 임시 수동 등록용. getPatients()는 여전히 KTAS 기준으로 목록을 만들고,
          여기서 등록한 정보는 "이미 KTAS가 있는 같은 접수번호"의 환자명/접수시간만 채워준다 —
          KTAS 없는 신규 접수 건은 등록해도 아래 목록에 뜨지 않는다(CareServiceImpl 확인).
        */}
        Temporary manual entry until RCP integration. This only fills in patient name / received time
        for a reception that already has a KTAS record — it won&apos;t add a brand-new reception to the
        list below until KTAS is assessed for it.
      </p>

      {lastIntake ? (
        <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {/* 등록됨: {접수번호} — {환자명} ({경로}) · {일시} */}
          Registered: {lastIntake.receptionId} — {lastIntake.patientName} ({arrivalPathLabel(lastIntake.arrivalPath)}) ·{" "}
          {formatDateTime(lastIntake.receivedAt)}
        </p>
      ) : null}
      {submitError ? <Alert variant="error">{resolveEmergencyMessage(submitError)}</Alert> : null}

      <div className="flex flex-wrap gap-3">
        {/* 접수번호 */}
        <FormField label="Reception ID" required className="w-[180px]">
          <Input name="receptionId" value={form.receptionId} onChange={handleChange} disabled={submitting} maxLength={36} placeholder="ER-20260909-004" />
        </FormField>
        {/* 환자ID */}
        <FormField label="Patient ID" required className="w-[180px]">
          <Input name="patientId" value={form.patientId} onChange={handleChange} disabled={submitting} maxLength={36} />
        </FormField>
        {/* 환자명 */}
        <FormField label="Patient Name" required className="w-[160px]">
          <Input name="patientName" value={form.patientName} onChange={handleChange} disabled={submitting} maxLength={100} />
        </FormField>
        {/* 내원경로 */}
        <FormField label="Arrival Path" required className="w-[160px]">
          <Select
            name="arrivalPath"
            value={form.arrivalPath}
            onChange={handleChange}
            options={[...ARRIVAL_PATH_OPTIONS]}
            // 선택
            placeholder="Select"
            disabled={submitting}
          />
        </FormField>
        {/* 접수일시 */}
        <FormField label="Received At" required className="w-[220px]">
          <input
            type="datetime-local"
            name="receivedAt"
            value={form.receivedAt}
            onChange={handleChange}
            disabled={submitting}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 disabled:text-slate-500"
          />
        </FormField>
        {/* 주호소(원문) */}
        <FormField label="Chief Complaint" className="min-w-[220px] flex-1">
          <Input name="chiefComplaintRaw" value={form.chiefComplaintRaw} onChange={handleChange} disabled={submitting} maxLength={500} />
        </FormField>
        {/* 메모 */}
        <FormField label="Memo" className="min-w-[220px] flex-1">
          <Input name="memo" value={form.memo} onChange={handleChange} disabled={submitting} maxLength={500} />
        </FormField>
      </div>
      <div className="mt-3 flex justify-end">
        <Button type="button" onClick={handleSubmit} disabled={submitting || !canSubmit}>
          {/* 등록 중... / 접수 등록 */}
          {submitting ? "Registering..." : "Register Intake"}
        </Button>
      </div>
    </section>
  );
}
