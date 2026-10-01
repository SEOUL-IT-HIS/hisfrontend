"use client";

import { Fragment, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import { searchBillingDetailRequest } from "@/features/billing/searchBillingDetail/slice";
import type { SearchPatientResult } from "@/features/billing/searchBillingDetail/types";
import BillingDetailSearchList from "@/components/billing/detail/BillingDetailSearchList";
import { Alert, Button, FormField, Input, Panel } from "@/components/common";

type PatientGroup = {
    patientId: string;
    patientName: string;
    birthDate: string;
    phoneNo: string;
    bills: SearchPatientResult[];
};

/** 검색 결과를 환자(patientId) 기준으로 묶는다 — 같은 환자가 미수납 건마다 한 줄씩 반복되는 걸 방지 */
function groupByPatient(results: SearchPatientResult[]): PatientGroup[] {
    const groups = new Map<string, PatientGroup>();
    for (const result of results) {
        const existing = groups.get(result.patientId);
        if (existing) {
            existing.bills.push(result);
            continue;
        }
        groups.set(result.patientId, {
            patientId: result.patientId,
            patientName: result.patientName,
            birthDate: result.birthDate,
            phoneNo: result.phoneNo,
            bills: [result],
        });
    }
    return Array.from(groups.values());
}

type BillingDetailSearchFormProps = {
    selectedBillingId: string | null;
    onSelectPatient: (billingId: string) => void;
};

export default function BillingDetailSearchForm({
    selectedBillingId,
    onSelectPatient,
}: BillingDetailSearchFormProps) {
    const dispatch = useDispatch<AppDispatch>();
    const [patientName, setPatientName] = useState("");
    const { searchPatient, loading, error } = useSelector(
        (state: RootState) => state.billing.billingDetail,
    );

    const patientGroups = useMemo(() => groupByPatient(searchPatient), [searchPatient]);

    /** 미수납 건이 2개 이상인 환자 그룹의 펼침 상태. 선택된 건이 그 그룹 안에 있으면 항상 펼쳐서 보여준다 */
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

    const onSearch = () => {
        dispatch(searchBillingDetailRequest({ patientName }));// 환자명을 기준으로 진료비 상세 정보를 검색하는 액션을 디스패치합니다.
    };

    const toggleGroup = (patientId: string) => {
        setOpenGroups((prev) => ({ ...prev, [patientId]: !prev[patientId] }));
    };

    return (
        <Panel>
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
                <div>
                    <h2 className="text-sm font-semibold text-slate-900">Search Patient</h2>
                    <p className="mt-0.5 text-xs text-slate-400">Click a row to view details on the right</p>
                </div>
                <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-white">
                    {searchPatient.length} results
                </span>
            </div>

            <form
                onSubmit={(event) => {
                    event.preventDefault();// 리렌더링 방지
                    onSearch();// 검색 버튼 클릭 시 onSearch 함수를 호출하여 환자명을 기준으로 진료비 상세 정보를 검색합니다.
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
                <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 backdrop-blur">
                        <tr className="text-xs uppercase tracking-wide text-slate-400">
                            <th className="px-5 py-3 font-medium">Name</th>
                            <th className="px-5 py-3 font-medium">Birth Date</th>
                            <th className="px-5 py-3 font-medium">Phone</th>
                            <th className="px-5 py-3 font-medium">Type</th>
                            <th className="px-5 py-3 text-right font-medium">Amount</th>
                            <th className="px-5 py-3 font-medium">Created At</th>
                            <th className="px-5 py-3 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="px-5 py-20 text-center text-slate-400">
                                    Loading...
                                </td>
                            </tr>
                        ) : patientGroups.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-5 py-20 text-center text-slate-400">
                                    No results found.
                                </td>
                            </tr>
                        ) : (
                            patientGroups.map((group) => {
                                // 미수납 건이 1개뿐이면 지금까지와 동일하게 한 줄만 그린다
                                if (group.bills.length === 1) {
                                    const patient = group.bills[0];
                                    return (
                                        <BillingDetailSearchList
                                            key={patient.billingId}
                                            patient={patient}
                                            selected={selectedBillingId === patient.billingId}
                                            onSelect={onSelectPatient}
                                        />
                                    );
                                }

                                // 여러 건이면 이름 행을 한 번만 보여주고, 펼쳤을 때만 건별로 나열한다
                                const hasSelected = group.bills.some((bill) => bill.billingId === selectedBillingId);
                                const expanded = openGroups[group.patientId] ?? hasSelected;

                                return (
                                    <Fragment key={group.patientId}>
                                        <tr
                                            onClick={() => toggleGroup(group.patientId)}
                                            className="cursor-pointer border-t border-slate-50 transition-colors hover:bg-slate-50"
                                        >
                                            <td className="px-5 py-3.5">
                                                <span className="font-semibold text-slate-800">{group.patientName}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-600">{group.birthDate}</td>
                                            <td className="px-5 py-3.5 text-slate-600">{group.phoneNo}</td>
                                            <td className="px-5 py-3.5" colSpan={3}>
                                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                                    {group.bills.length} unpaid
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right text-slate-400">
                                                <svg
                                                    viewBox="0 0 20 20"
                                                    className={`ml-auto h-3.5 w-3.5 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.8"
                                                    aria-hidden
                                                >
                                                    <path d="M5 7.5 10 12.5 15 7.5" />
                                                </svg>
                                            </td>
                                        </tr>
                                        {expanded
                                            ? group.bills.map((patient) => (
                                                  <BillingDetailSearchList
                                                      key={patient.billingId}
                                                      patient={patient}
                                                      selected={selectedBillingId === patient.billingId}
                                                      onSelect={onSelectPatient}
                                                      nested
                                                  />
                                              ))
                                            : null}
                                    </Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </Panel>
    );
}
// 환자 검색 폼 컴포넌트입니다. 환자명을 입력하고 검색 버튼을 클릭하면, 
// 해당 환자의 진료비 상세 정보를 조회할 수 있습니다. 검색 결과는 테이블 형식으로 표시되며, 
// 각 행을 클릭하면 오른쪽 패널에서 상세 정보를 확인할 수 있습니다.