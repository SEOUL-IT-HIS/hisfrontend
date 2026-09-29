"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { Alert, Button, FormField, Input, Select } from "@/components/common";
import { resolveEmergencyMessage } from "@/features/emergency/messages";
import {
  createClinicalNoteRequest,
  fetchClinicalNotesRequest,
  selectClinicalNoteError,
  selectClinicalNoteItems,
  selectClinicalNoteLoading,
  selectClinicalNoteSubmitError,
  selectClinicalNoteSubmitting,
} from "@/features/emergency/care/clinicalNote/slice";
import { NOTE_TYPE_OPTIONS } from "@/features/emergency/care/clinicalNote/types";
import { formatDateTime } from "@/features/emergency/utils";

type ClinicalNotePanelProps = {
  receptionNo: string;
  className?: string;
};

const initialForm = { noteTypeCode: "", content: "", recordedById: "" };

function noteTypeLabel(code: string): string {
  return NOTE_TYPE_OPTIONS.find((o) => o.value === code)?.label ?? code;
}

/**
 * 서명(signedAt) 처리는 백엔드에 등록 API만 있고 서명 API가 없어 조회만 표시한다.
 */
export default function ClinicalNotePanel({ receptionNo, className = "" }: ClinicalNotePanelProps) {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector(selectClinicalNoteItems);
  const loading = useSelector(selectClinicalNoteLoading);
  const error = useSelector(selectClinicalNoteError);
  const submitting = useSelector(selectClinicalNoteSubmitting);
  const submitError = useSelector(selectClinicalNoteSubmitError);

  const [form, setForm] = useState(initialForm);
  const [lastCount, setLastCount] = useState(0);

  useEffect(() => {
    if (receptionNo) {
      dispatch(fetchClinicalNotesRequest(receptionNo));
    }
  }, [dispatch, receptionNo]);

  if (items.length > lastCount) {
    setLastCount(items.length);
    if (!submitting && !submitError) {
      setForm(initialForm);
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit() {
    if (!form.noteTypeCode || !form.content.trim() || !form.recordedById.trim()) return;
    dispatch(
      createClinicalNoteRequest({
        encounterId: receptionNo,
        noteTypeCode: form.noteTypeCode,
        content: form.content.trim(),
        recordedById: form.recordedById.trim(),
      }),
    );
  }

  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}>
      <h3 className="mb-3 text-sm font-semibold text-slate-800">Clinical Notes</h3>

      {loading ? (
        <p className="py-4 text-center text-sm text-slate-400">Loading clinical notes...</p>
      ) : error ? (
        <Alert variant="error">{resolveEmergencyMessage(error)}</Alert>
      ) : (
        <>
          {items.length > 0 ? (
            <ul className="mb-4 space-y-2">
              {items.map((item) => (
                <li key={item.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="text-xs font-medium text-sky-600">{noteTypeLabel(item.noteTypeCode)}</p>
                  <p className="whitespace-pre-wrap text-slate-800">{item.content}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {item.recordedById} · {formatDateTime(item.recordedAt)}
                    {item.signedAt ? ` · Signed (${formatDateTime(item.signedAt)})` : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-4 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-400">
              No clinical notes recorded yet.
            </p>
          )}

          {submitError ? <Alert variant="error">{resolveEmergencyMessage(submitError)}</Alert> : null}

          <FormField label="Note Type" required className="max-w-[220px]">
            <Select
              name="noteTypeCode"
              value={form.noteTypeCode}
              onChange={handleChange}
              options={[...NOTE_TYPE_OPTIONS]}
              placeholder="Select"
              disabled={submitting}
            />
          </FormField>
          <FormField label="Note Content" required className="mt-3">
            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
              disabled={submitting}
              className="w-full min-h-[80px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </FormField>
          <FormField label="Recorded By ID" required className="mt-3 max-w-[220px]">
            <Input name="recordedById" value={form.recordedById} onChange={handleChange} disabled={submitting} maxLength={36} />
          </FormField>

          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !form.noteTypeCode || !form.content.trim() || !form.recordedById.trim() || !receptionNo}
            >
              {submitting ? "Saving..." : "Register Clinical Note"}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
