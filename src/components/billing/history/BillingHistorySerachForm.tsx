"use client";

import { AppDispatch, RootState } from "@/store/store";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { searchBillingHistoryRequest } from "@/features/billing/history/slice";
import BillingHistorySearchList from "@/components/billing/history/BillingHistorySearchList";
import { Alert, Button, FormField, Input, Panel } from "@/components/common";

type BillingHistorySearchFormProps = {
    selectedPatientId: string | null;
    onSelectPatient: (patientId: string) => void;
};

export default function BillingHistorySearchForm({
    selectedPatientId,
    onSelectPatient,
}: BillingHistorySearchFormProps) {
    const dispatch = useDispatch<AppDispatch>();
    const [patientName, setPatientName] = useState("");
    const { searchList, searchStatus } = useSelector(
        (state: RootState) => state.billing.billingHistory,
    );
    const { loading, error } = searchStatus;

    const onSearch = () => {
        dispatch(searchBillingHistoryRequest({ patientName }));
    };

    return (
        <Panel>
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
                <div>
                    <h2 className="text-sm font-semibold text-slate-900">Search Patient</h2>
                    <p className="mt-0.5 text-xs text-slate-400">Click a row to view history on the right</p>
                </div>
                <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-white">
                    {searchList.length} results
                </span>
            </div>

            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    onSearch();
                }}
                className="border-b border-slate-100 bg-slate-50/60 px-5 py-3"
            >
                <div className="flex flex-wrap items-end gap-3">
                    <FormField label="Patient Name" htmlFor="patientName" className="min-w-[200px] flex-1">
                        <Input
                            id="patientName"
                            value={patientName}
                            placeholder="Enter patient name"
                            onChange={(event) => setPatientName(event.target.value)}
                        />
                    </FormField>
                    <Button type="submit" variant="primary">Search</Button>
                </div>
            </form>

            {error ? (
                <div className="px-5 pt-3">
                    <Alert variant="error">{error}</Alert>
                </div>
            ) : null}

            <div className="min-h-0 flex-1 overflow-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 backdrop-blur">
                        <tr className="text-xs uppercase tracking-wide text-slate-400">
                            <th className="px-5 py-3 font-medium">Name</th>
                            <th className="px-5 py-3 font-medium">Birth Date</th>
                            <th className="px-5 py-3 font-medium">Phone</th>
                            <th className="px-5 py-3 font-medium">Address</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-5 py-20 text-center text-slate-400">
                                    Loading...
                                </td>
                            </tr>
                        ) : searchList.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-5 py-20 text-center text-slate-400">
                                    No results found.
                                </td>
                            </tr>
                        ) : (
                            searchList.map((patient) => (
                                <BillingHistorySearchList
                                    key={patient.patientId}
                                    patient={patient}
                                    selected={selectedPatientId === patient.patientId}
                                    onSelect={onSelectPatient}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </Panel>
    );
}
