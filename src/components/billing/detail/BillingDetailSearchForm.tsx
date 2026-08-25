"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import { searchBillingDetailRequest } from "@/features/billing/searchBillingDetail/slice";
import BillingDetailSearchList from "@/components/billing/detail/BillingDetailSearchList";
import { Alert, Button, FormField, Input, Panel } from "@/components/common";

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
        (state: RootState) => state.billingDetail,
    );

    const onSearch = () => {
        dispatch(searchBillingDetailRequest({ patientName }));// 환자명을 기준으로 진료비 상세 정보를 검색하는 액션을 디스패치합니다.
    };

    return (
        <Panel>
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
                <div>
                    <h2 className="text-sm font-semibold text-slate-900">환자 검색</h2>
                    <p className="mt-0.5 text-xs text-slate-400">행 클릭 시 오른쪽에 상세가 열립니다</p>
                </div>
                <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-white">
                    {searchPatient.length}건
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
                    <FormField label="환자명" htmlFor="patientName" className="min-w-[200px] flex-1">
                        <Input
                            id="patientName"
                            value={patientName}
                            placeholder="환자명을 입력하세요"
                            onChange={(event) => setPatientName(event.target.value)}
                        />
                    </FormField>
                    <Button type="submit" variant="primary">환자 검색</Button>
                </div>
            </form>

            {error ? (
                <div className="px-5 pt-3">
                    <Alert variant="error">{error}</Alert>
                </div>
            ) : null}

            <div className="min-h-0 flex-1 overflow-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 backdrop-blur">
                        <tr className="text-xs uppercase tracking-wide text-slate-400">
                            <th className="px-5 py-3 font-medium">환자명</th>
                            <th className="px-5 py-3 font-medium">생년월일</th>
                            <th className="px-5 py-3 font-medium">연락처</th>
                            <th className="px-5 py-3 font-medium">주소</th>
                            <th className="px-5 py-3 font-medium">진료항목</th>
                            <th className="px-5 py-3 font-medium">수납상태</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-5 py-20 text-center text-slate-400">
                                    조회 중입니다...
                                </td>
                            </tr>
                        ) : searchPatient.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-5 py-20 text-center text-slate-400">
                                    검색 결과가 없습니다.
                                </td>
                            </tr>
                        ) : (
                            searchPatient.map((patient) => (
                                <BillingDetailSearchList
                                    key={patient.billingId}
                                    patient={patient}
                                    selected={selectedBillingId === patient.billingId}
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
// 해당 환자의 진료비 상세 정보를 조회할 수 있습니다. 검색 결과는 테이블 형식으로 표시되며, 
// 각 행을 클릭하면 오른쪽 패널에서 상세 정보를 확인할 수 있습니다.