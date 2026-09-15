"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button } from "@/components/common";
import type { AppDispatch, RootState } from "@/store/store";
import type { PatientContact } from "@/features/patient/type/patientContactType";
import {
    fetchPatientContactListRequest,
    mutatePatientContactRequest,
    resetPatientContact,
    resetPatientContactMutation,
} from "@/features/patient/slice/patientContactSlice";
import PatientContactFormModal, {
    type PatientContactFormValues,
} from "./PatientContactFormModal";

type Editor =
    | { mode: "create" }
    | { mode: "update"; item: PatientContact };

function formatPhoneNo(phoneNo: string | null) {
    if (!phoneNo) return "-";

    if (phoneNo.length === 11) {
        return `${phoneNo.slice(0, 3)}-${phoneNo.slice(3, 7)}-${phoneNo.slice(7)}`;
    }

    if (phoneNo.length === 10) {
        return `${phoneNo.slice(0, 3)}-${phoneNo.slice(3, 6)}-${phoneNo.slice(6)}`;
    }

    if (phoneNo.length === 9) {
        return `${phoneNo.slice(0, 2)}-${phoneNo.slice(2, 5)}-${phoneNo.slice(5)}`;
    }

    return phoneNo;
}

function formatTime(value: string) {
    return value.replace("T", " ").slice(0, 19);
}

function getAddress(item: PatientContact) {
    return [item.address, item.addressDetail]
        .filter((value): value is string => Boolean(value))
        .join(" ");
}

export default function PatientContactPanel({
    patientId,
    patientName,
}: {
    patientId: string;
    patientName: string;
}) {
    const dispatch = useDispatch<AppDispatch>();
    const state = useSelector((root: RootState) => root.patientContact);

    const [editor, setEditor] = useState<Editor | null>(null);
    const [visibleCount, setVisibleCount] = useState(2);

    const current = state.patientId === patientId;
    const items = current ? state.items : [];
    const loading = !current || state.listLoading;
    const busy = current && state.mutationLoading;

    useEffect(() => {
        dispatch(resetPatientContact());
        dispatch(
            fetchPatientContactListRequest({
                patientId,
                includeInactive: false,
            }),
        );

        return () => {
            dispatch(resetPatientContact());
        };
    }, [dispatch, patientId]);

    function openEditor(value: Editor) {
        dispatch(resetPatientContactMutation());
        setEditor(value);
    }

    function closeEditor() {
        if (busy) return;

        setEditor(null);
        dispatch(resetPatientContactMutation());
    }

    function submitForm(values: PatientContactFormValues) {
        if (!editor || busy) return;

        if (editor.mode === "create") {
            dispatch(
                mutatePatientContactRequest({
                    kind: "create",
                    patientId,
                    ...values,
                }),
            );
            return;
        }

        dispatch(
            mutatePatientContactRequest({
                kind: "update",
                patientId,
                contactId: editor.item.contactId,
                ...values,
            }),
        );
    }

    function setPrimary(item: PatientContact) {
        if (busy || item.primaryYn === "Y") return;

        dispatch(resetPatientContactMutation());

        dispatch(
            mutatePatientContactRequest({
                kind: "setPrimary",
                patientId,
                contactId: item.contactId,
            }),
        );
    }

    function deactivate(item: PatientContact) {
        if (busy || item.primaryYn === "Y") return;

        const confirmed = window.confirm(
            "Deactivate this address and contact information?\nIt will remain available under Include inactive.",
        );

        if (!confirmed) return;

        dispatch(resetPatientContactMutation());

        dispatch(
            mutatePatientContactRequest({
                kind: "deactivate",
                patientId,
                contactId: item.contactId,
            }),
        );
    }

    return (
        <section
            aria-labelledby="patient-contact-heading"
            className="border-t border-slate-200"
        >
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="flex items-center gap-2">
                    <h2
                        id="patient-contact-heading"
                        className="text-base font-semibold text-slate-800"
                    >
                        Address and Contact Information
                    </h2>

                    {!loading && !state.listError ? (
                        <span className="rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700">
                            Active: {items.filter((item) => item.activeYn === "Y").length}
                        </span>
                    ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input
                            type="checkbox"
                            checked={current && state.includeInactive}
                            disabled={!current || busy}
                            onChange={(event) => {
                                setVisibleCount(2);

                                dispatch(
                                    fetchPatientContactListRequest({
                                        patientId,
                                        includeInactive: event.target.checked,
                                    }),
                                );
                            }}
                        />
                        Include inactive
                    </label>

                    <Button
                        disabled={!current || busy}
                        onClick={() => openEditor({ mode: "create" })}
                    >
                        + Add Address and Contact Information
                    </Button>
                </div>
            </div>

            <div aria-live="polite" className="space-y-3 px-5 pb-4">
                {current && state.mutationSuccess ? (
                    <Alert variant="success">
                        Address and contact information saved successfully.
                    </Alert>
                ) : null}

                {current && state.mutationError && !editor ? (
                    <Alert>{state.mutationError}</Alert>
                ) : null}

                {current && state.listError ? (
                    <div className="space-y-2">
                        <Alert>{state.listError}</Alert>

                        <Button
                            variant="secondary"
                            disabled={loading}
                            onClick={() =>
                                dispatch(
                                    fetchPatientContactListRequest({
                                        patientId,
                                        includeInactive: state.includeInactive,
                                    }),
                                )
                            }
                        >
                            Retry
                        </Button>
                    </div>
                ) : null}

                {loading ? (
                    <p className="text-sm text-slate-500">
                        Loading address and contact information...
                    </p>
                ) : null}

                {!loading && !state.listError && items.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-200 px-4 py-7 text-center text-sm text-slate-500">
                        {state.includeInactive
                            ? "No address or contact information has been registered."
                            : "No active address or contact information."}
                    </p>
                ) : null}
            </div>

            {!loading && !state.listError ? (
                <ul className="divide-y divide-slate-100">
                    {items.slice(0, visibleCount).map((item) => {
                        const address = getAddress(item);

                        return (
                            <li
                                key={item.contactId}
                                className={`px-5 py-4 ${item.activeYn === "N" ? "bg-slate-50" : ""
                                    }`}
                            >
                                <div className="flex flex-wrap items-center gap-2">
                                    <span
                                        className={`rounded-md px-2 py-1 text-xs font-medium ${item.activeYn === "Y"
                                                ? "bg-sky-50 text-sky-700"
                                                : "bg-slate-200 text-slate-600"
                                            }`}
                                    >
                                        {item.activeYn === "Y" ? "Active" : "Inactive"}
                                    </span>

                                    {item.primaryYn === "Y" ? (
                                        <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
                                            ★ Primary
                                        </span>
                                    ) : null}
                                </div>

                                <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[120px_1fr]">
                                    <dt className="text-slate-500">Postal Code</dt>
                                    <dd className="text-slate-800">{item.zipCode ?? "-"}</dd>

                                    <dt className="text-slate-500">Address</dt>
                                    <dd className="break-words text-slate-800">
                                        {address || "-"}
                                    </dd>

                                    <dt className="text-slate-500">Phone Number</dt>
                                    <dd className="text-slate-800">
                                        {formatPhoneNo(item.phoneNo)}
                                    </dd>
                                </dl>

                                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                    <div className="text-xs text-slate-500">
                                        <p>Created: {formatTime(item.createdAt)}</p>
                                        <p>Updated: {formatTime(item.updatedAt)}</p>
                                    </div>

                                    {item.activeYn === "Y" ? (
                                        <div className="flex flex-wrap gap-2">
                                            {item.primaryYn === "N" ? (
                                                <Button
                                                    variant="secondary"
                                                    disabled={busy}
                                                    onClick={() => setPrimary(item)}
                                                >
                                                    Set as Primary
                                                </Button>
                                            ) : null}

                                            <Button
                                                variant="secondary"
                                                disabled={busy}
                                                onClick={() =>
                                                    openEditor({
                                                        mode: "update",
                                                        item,
                                                    })
                                                }
                                            >
                                                Edit
                                            </Button>

                                            {item.primaryYn === "N" ? (
                                                <Button
                                                    variant="ghost"
                                                    disabled={busy}
                                                    onClick={() => deactivate(item)}
                                                >
                                                    Deactivate
                                                </Button>
                                            ) : (
                                                <span className="self-center text-xs text-slate-500">
                                                    The primary entry cannot be deactivated.
                                                </span>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            ) : null}

            {!loading && !state.listError && items.length > 0 ? (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
                    <p className="text-xs text-slate-500" aria-live="polite">
                        {Math.min(visibleCount, items.length)} of {items.length}
                    </p>

                    <div className="flex flex-wrap gap-2">
                        {items.length > visibleCount ? (
                            <Button
                                variant="secondary"
                                disabled={busy}
                                onClick={() => setVisibleCount((count) => count + 2)}
                            >
                                Show {Math.min(2, items.length - visibleCount)} more
                            </Button>
                        ) : null}

                        {visibleCount > 2 ? (
                            <Button
                                variant="ghost"
                                disabled={busy}
                                onClick={() => setVisibleCount(2)}
                            >
                                Show less
                            </Button>
                        ) : null}
                    </div>
                </div>
            ) : null}

            {editor && current && !state.mutationSuccess ? (
                <PatientContactFormModal
                    patientId={patientId}
                    patientName={patientName}
                    mode={editor.mode}
                    item={editor.mode === "update" ? editor.item : undefined}
                    submitting={busy}
                    error={state.mutationError}
                    onClose={closeEditor}
                    onSubmit={submitForm}
                />
            ) : null}
        </section>
    );
}