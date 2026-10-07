"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import { searchBillingDetailRequest } from "@/features/billing/searchBillingDetail/slice";
import type {
    PatientBillingGroup,
    SearchPatientResult,
} from "@/features/billing/searchBillingDetail/types";
import BillingDetailSearchList from "@/components/billing/detail/BillingDetailSearchList";
import { Alert, Button, FormField, Input, Panel } from "@/components/common";

/** 검색 결과를 환자(patientId) 기준으로 묶는다 — 미수납 건이 여러 개여도 환자당 한 줄로 보여주고 한 번에 수납 */
function groupByPatient(results: SearchPatientResult[]): PatientBillingGroup[] {
    const groups = new Map<string, PatientBillingGroup>();
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

const RECENT_UNPAID_LIMIT = 5; // 검색 전 첫 화면에 보여줄 최근 미수납 건 수

type BillingDetailSearchFormProps = {
    selectedPatientId: string | null;
    onSelectPatient: (patientId: string) => void;
};

export default function BillingDetailSearchForm({
    selectedPatientId,
    onSelectPatient,
}: BillingDetailSearchFormProps) {
    const dispatch = useDispatch<AppDispatch>();
    const [patientName, setPatientName] = useState("");
    const { searchPatient, loading, error } = useSelector(
        (state: RootState) => state.billing.billingDetail,
    );

    // 사용자가 직접 검색하기 전에는 최근 미수납 건 일부만 보여줌(검색 결과는 billing_id 내림차순 = 최신순)
    const [searched, setSearched] = useState(false);

    useEffect(() => {
        dispatch(searchBillingDetailRequest({ patientName: "" })); // 화면 진입 시 이름 조건 없이 미수납 건 조회
    }, [dispatch]);

    const patientGroups = useMemo(
        () => groupByPatient(searched ? searchPatient : searchPatient.slice(0, RECENT_UNPAID_LIMIT)),
        [searchPatient, searched],
    );

    const onSearch = () => {
        setSearched(true);
        dispatch(searchBillingDetailRequest({ patientName }));// 환자명을 기준으로 진료비 상세 정보를 검색하는 액션을 디스패치합니다.
    };

    return (
        <Panel>
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
                <div>
                    <h2 className="text-sm font-semibold text-slate-900">Search Patient</h2>
                    <p className="mt-0.5 text-xs text-slate-400">
                        {searched
                            ? "Click a row to view details on the right"
                            : `Showing the ${RECENT_UNPAID_LIMIT} most recent unpaid bills - search to find others`}
                    </p>
                </div>
                <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-white">
                    {patientGroups.length} results
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
                            patientGroups.map((group) => (
                                <BillingDetailSearchList
                                    key={group.patientId}
                                    group={group}
                                    selected={selectedPatientId === group.patientId}
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
// 환자 검색 폼 컴포넌트입니다. 환자명을 입력하고 검색 버튼을 클릭하면,
// 미수납 건이 있는 환자가 한 줄씩 표시되고(여러 건이면 금액 합산),
// 행을 클릭하면 오른쪽 패널에서 그 환자의 미수납 항목 전체를 확인하고 한 번에 수납할 수 있습니다.
