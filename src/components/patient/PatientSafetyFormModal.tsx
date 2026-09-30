"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Alert, Button } from "@/components/common";
import type { PatientSafetyInfo } from "@/features/patient/type/patientSafetyType";

type Props = {
  patientName: string;
  patientId: string;
  mode: "create" | "update" | "deactivate";
  item?: PatientSafetyInfo;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (note: string) => void;
};

export default function PatientSafetyFormModal({
  patientName, patientId, mode, item, submitting, error, onClose, onSubmit,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const inputId = useId();
  const [note, setNote] = useState(item?.safetyNote ?? "");
  const [discarding, setDiscarding] = useState(false);
  const byteLength = new TextEncoder().encode(note).length;
  const valid = note.trim().length > 0 && byteLength <= 2000;
  const deactivating = mode === "deactivate";

  useEffect(() => {
    const element = dialog.current;
    const opener = document.activeElement;
    element?.showModal();
    return () => {
      element?.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);

  function requestClose() {
    if (submitting) return;
    if (!deactivating && note !== (item?.safetyNote ?? "")) setDiscarding(true);
    else onClose();
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); requestClose(); }}
      className="fixed inset-0 m-auto max-h-[90vh] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/45"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 id={titleId} className="text-base font-semibold">
          {discarding ? "Discard changes?" : deactivating ? "Deactivate safety information" : mode === "update" ? "Edit safety information" : "Add safety information"}
        </h2>
        <Button variant="ghost" aria-label="Close safety information dialog" disabled={submitting} onClick={requestClose}>✕</Button>
      </div>
      <div className="px-5 py-4">
        <div className="mb-4 rounded-xl bg-slate-50 px-3 py-2">
          <p className="font-semibold">{patientName}</p>
          <p className="break-all text-xs text-slate-500">Patient ID: {patientId}</p>
        </div>
        {discarding ? (
          <>
            <p className="text-sm text-slate-700">Your unsaved changes will be lost.</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDiscarding(false)}>Keep editing</Button>
              <Button variant="danger" onClick={onClose}>Discard</Button>
            </div>
          </>
        ) : (
          <form onSubmit={(event) => { event.preventDefault(); if (!submitting && (deactivating || valid)) onSubmit(note); }}>
            {deactivating ? (
              <>
                <p className="mb-3 whitespace-pre-wrap break-words rounded-xl border border-slate-200 p-3 text-sm">{item?.safetyNote}</p>
                <p className="text-sm text-slate-600">This information will be hidden from the active list. It will remain available under “Include inactive”.</p>
              </>
            ) : (
              <>
                <label htmlFor={inputId} className="text-sm font-medium">Safety information <span className="text-rose-600">*</span></label>
                <textarea
                  id={inputId}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  disabled={submitting}
                  required
                  rows={6}
                  aria-describedby={`${inputId}-limit`}
                  aria-invalid={byteLength > 2000 || (note.length > 0 && !note.trim())}
                  placeholder="Enter patient safety information"
                  className="mt-2 block w-full resize-y rounded-xl border border-slate-300 px-3 py-2 text-sm outline-offset-2 focus:outline-sky-600 disabled:bg-slate-50"
                />
                <p id={`${inputId}-limit`} className={`mt-2 text-right text-xs ${byteLength > 2000 ? "text-rose-600" : "text-slate-500"}`}>
                  {byteLength.toLocaleString()} / 2,000 UTF-8 bytes
                </p>
                {byteLength > 2000 ? <p role="alert" className="mt-1 text-sm text-rose-600">Reduce the content to 2,000 bytes or less.</p> : null}
                {note.length > 0 && !note.trim() ? <p role="alert" className="mt-1 text-sm text-rose-600">Safety information cannot contain only whitespace.</p> : null}
              </>
            )}
            {error ? <Alert className="mt-3">{error}</Alert> : null}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={requestClose} disabled={submitting}>Cancel</Button>
              <Button type="submit" variant={deactivating ? "danger" : "primary"} disabled={submitting || (!deactivating && !valid)}>
                {submitting ? "Saving..." : deactivating ? "Deactivate" : mode === "update" ? "Save" : "Add"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}
