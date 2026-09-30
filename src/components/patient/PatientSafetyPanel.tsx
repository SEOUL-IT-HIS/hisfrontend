"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button } from "@/components/common";
import type { AppDispatch, RootState } from "@/store/store";
import type { PatientSafetyInfo } from "@/features/patient/type/patientSafetyType";
import {
  fetchSafetyListRequest, resetPatientSafety, resetSafetyMutation, mutateSafetyRequest,
} from "@/features/patient/slice/patientSafetySlice";
import PatientSafetyFormModal from "./PatientSafetyFormModal";

type Editor = { mode: "create" } | { mode: "update" | "deactivate"; item: PatientSafetyInfo };
const formatTime = (value: string) => value.replace("T", " ").slice(0, 19);

export default function PatientSafetyPanel({ patientId, patientName }: { patientId: string; patientName: string }) {
  const dispatch = useDispatch<AppDispatch>();
  const state = useSelector((root: RootState) => root.patientSafety);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [visibleCount, setVisibleCount] = useState(2);
  const current = state.patientId === patientId;
  const items = current ? state.items : [];
  const loading = !current || state.listLoading;
  const busy = current && state.mutationLoading;
  const pinnedCount = items.filter((item) => item.activeYn === "Y" && item.pinnedYn === "Y").length;

  useEffect(() => {
    dispatch(resetPatientSafety());
    dispatch(fetchSafetyListRequest({ patientId, includeInactive: false }));
    return () => { dispatch(resetPatientSafety()); };
  }, [dispatch, patientId]);

  function openEditor(value: Editor) {
    dispatch(resetSafetyMutation());
    setEditor(value);
  }

  return (
    <section aria-labelledby="patient-safety-heading" className="border-t border-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-2">
          <h2 id="patient-safety-heading" className="text-base font-semibold text-slate-800">Safety Information</h2>
          {!loading && !state.listError ? <span className="rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700">{items.filter((item) => item.activeYn === "Y").length} active</span> : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={current && state.includeInactive} disabled={!current || busy}
              onChange={(event) => { setVisibleCount(2); dispatch(fetchSafetyListRequest({ patientId, includeInactive: event.target.checked })); }} />
            Include inactive
          </label>
          <Button disabled={!current || busy} onClick={() => openEditor({ mode: "create" })}>+ Add safety information</Button>
        </div>
      </div>
      <div aria-live="polite" className="space-y-3 px-5 pb-4">
        {current && state.mutationSuccess ? <Alert variant="success">Safety information saved successfully.</Alert> : null}
        {current && state.mutationError && !editor ? <Alert>{state.mutationError}</Alert> : null}
        {pinnedCount >= 2 ? <p className="text-xs text-slate-500">2 items pinned. Unpin one before pinning another.</p> : null}
        {current && state.listError ? <div className="space-y-2"><Alert>{state.listError}</Alert><Button variant="secondary" disabled={loading} onClick={() => dispatch(fetchSafetyListRequest({ patientId, includeInactive: state.includeInactive }))}>Retry list</Button></div> : null}
        {loading ? <p className="text-sm text-slate-500">Loading safety information...</p> : null}
        {!loading && !state.listError && items.length === 0 ? <p className="rounded-xl border border-dashed border-slate-200 px-4 py-7 text-center text-sm text-slate-500">{state.includeInactive ? "No safety information has been registered." : "No active safety information."}</p> : null}
      </div>
      {!loading && !state.listError ? <ul className="divide-y divide-slate-100">
        {items.slice(0, visibleCount).map((item) => <li key={item.safetyInfoId} className={`px-5 py-4 ${item.activeYn === "N" ? "bg-slate-50" : ""}`}>
          <span className={`rounded-md px-2 py-1 text-xs font-medium ${item.activeYn === "Y" ? "bg-sky-50 text-sky-700" : "bg-slate-200 text-slate-600"}`}>{item.activeYn === "Y" ? "Active" : "Inactive"}</span>
          {item.pinnedYn === "Y" ? <span className="ml-2 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">📌 Pinned</span> : null}
          <SafetyNote note={item.safetyNote} />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500"><p>Created: {formatTime(item.createdAt)}</p><p>Updated: {formatTime(item.updatedAt)}</p></div>
            {item.activeYn === "Y" ? <div className="flex flex-wrap gap-2">
              <Button variant="secondary" disabled={busy || (item.pinnedYn !== "Y" && pinnedCount >= 2)} onClick={() => {
                setEditor(null);
                setVisibleCount(2);
                dispatch(mutateSafetyRequest({ kind: "pin", patientId, safetyInfoId: item.safetyInfoId, pinned: item.pinnedYn !== "Y" }));
              }}>{item.pinnedYn === "Y" ? "Unpin" : "Pin"}</Button>
              <Button variant="secondary" disabled={busy} onClick={() => openEditor({ mode: "update", item })}>Edit</Button><Button variant="ghost" disabled={busy} onClick={() => openEditor({ mode: "deactivate", item })}>Deactivate</Button></div> : null}
          </div>
        </li>)}
      </ul> : null}
      {!loading && !state.listError && items.length > 0 ? <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
        <p className="text-xs text-slate-500" aria-live="polite">Showing {Math.min(visibleCount, items.length)} of {items.length} · {pinnedCount} pinned</p>
        {items.length > visibleCount ? <Button variant="secondary" disabled={busy} onClick={() => setVisibleCount((count) => count + 2)}>Show {Math.min(2, items.length - visibleCount)} more · {items.length - visibleCount} remaining</Button> : null}
        {visibleCount > 2 ? <Button variant="ghost" disabled={busy} onClick={() => setVisibleCount(2)}>Collapse to 2</Button> : null}
      </div> : null}
      {editor && current && !state.mutationSuccess ? <PatientSafetyFormModal
        patientId={patientId} patientName={patientName} mode={editor.mode}
        item={editor.mode === "create" ? undefined : editor.item}
        submitting={busy} error={state.mutationError}
        onClose={() => { if (!busy) { setEditor(null); dispatch(resetSafetyMutation()); } }}
        onSubmit={(safetyNote) => {
          if (busy) return;
          if (editor.mode === "create") dispatch(mutateSafetyRequest({ kind: "create", patientId, safetyNote }));
          else if (editor.mode === "update") dispatch(mutateSafetyRequest({ kind: "update", patientId, safetyInfoId: editor.item.safetyInfoId, safetyNote }));
          else dispatch(mutateSafetyRequest({ kind: "deactivate", patientId, safetyInfoId: editor.item.safetyInfoId }));
        }}
      /> : null}
    </section>
  );
}

function SafetyNote({ note }: { note: string }) {
  const [expanded, setExpanded] = useState(false);
  const long = note.length > 180 || note.split("\n").length > 3;
  return <div className="mt-3">
    <p className={`whitespace-pre-wrap break-words text-sm text-slate-800 ${long && !expanded ? "line-clamp-3" : ""}`}>{note}</p>
    {long ? <button type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)} className="mt-1 text-sm font-medium text-sky-700 hover:underline">{expanded ? "Show less" : "Show more"}</button> : null}
  </div>;
}
