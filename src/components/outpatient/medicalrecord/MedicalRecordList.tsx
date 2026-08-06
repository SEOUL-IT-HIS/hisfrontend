"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { Alert, Button, Input } from "@/components/common";
import MedicalRecordDetail from "@/components/outpatient/medicalrecord/MedicalRecordDetail";
import { fetchRecordListRequest } from "@/features/outpatient/medicalrecord/slice";
import type { AppDispatch, RootState } from "@/store/store";

const formatDateTime = (value: string) => (value ? value.replace("T", " ").slice(0, 19) : "-");

const MedicalRecordList = () => {
    const dispatch = useDispatch<AppDispatch>();

    const searchParams = useSearchParams();
    const initialEncounterId = searchParams.get("encounterId") ?? "";

    const [encounterIdInput, setEncounterIdInput] = useState(initialEncounterId);
    const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

    const { loading, error, list } = useSelector(
        (state: RootState) => ({
            loading: state.outpatient.medicalrecord.listStatus.loading,
            error: state.outpatient.medicalrecord.listStatus.error,
            list: state.outpatient.medicalrecord.list,
        }),
        shallowEqual
    );

    useEffect(() => {
        dispatch(
            fetchRecordListRequest({ encounterId: initialEncounterId })
        );
    }, [dispatch, initialEncounterId]);

    function handleSearch() {
        const encounterId = encounterIdInput.trim();
        setSelectedRecordId(null);
        // 빈값일 때는 encounterId: "" 전송
        dispatch(fetchRecordListRequest({ encounterId }));
    }

    function handleReset() {
        setEncounterIdInput("");
        setSelectedRecordId(null);
        // 초기화 시 빈 문자열 전송
        dispatch(fetchRecordListRequest({ encounterId: "" }));
    }

    return (
        <div className="flex h-full min-h-0 flex-col gap-3 p-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                <h1 className="text-lg font-bold text-slate-800">진료기록 조회</h1>

                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <Input
                            id="encounterId"
                            value={encounterIdInput}
                            placeholder="진료ID 입력"
                            onChange={(e) => setEncounterIdInput(e.target.value)}
                        />
                    </div>
                    <Button variant="secondary" onClick={handleReset}>
                        초기화
                    </Button>
                    <Button variant="primary" onClick={handleSearch}>
                        조회
                    </Button>
                </div>
            </div>

            {error && <Alert variant="error">{error}</Alert>}

            {loading ? (
                <p className="p-4 text-center text-slate-500">진료 기록을 불러오는 중입니다...</p>
            ) : (
                <div className="min-h-[450px] overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                    <table className="w-full table-fixed text-left border-collapse text-sm">
                        <thead className="bg-slate-100 border-b border-slate-200 text-slate-700">
                        <tr>
                            <th className="w-[150px] p-3 font-semibold">환자번호</th>
                            <th className="w-[150px] p-3 font-semibold">환자명</th>
                            <th className="w-[150px] p-3 font-semibold">주호소</th>
                            <th className="w-[150px] p-3 font-semibold">상태</th>
                            <th className="w-[150px] p-3 font-semibold">작성일시</th>
                            <th className="w-[150px] p-3 font-semibold ">관리</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-800">
                        {list && list.length > 0 ? (
                            list.map((record) => (
                                <tr key={record.recordId} className="hover:bg-slate-50 transition">
                                    <td className="p-3">{record.patientNo ?? "-"}</td>
                                    <td className="p-3">{record.patientName ?? "미상"}</td>
                                    <td className="p-3">{record.chiefComplaint ?? "-"}</td>
                                    <td className="p-3">{record.status}</td>
                                    <td className="p-3">{formatDateTime(record.createdAt)}</td>
                                    <td className="p-3 ">
                                        <Button
                                            variant="secondary"
                                            onClick={() => setSelectedRecordId(record.recordId)}
                                        >
                                            상세보기
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="p-6 text-center text-slate-500">
                                    조회된 진료 기록이 없습니다.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            )}

            <MedicalRecordDetail recordId={selectedRecordId} onClose={() => setSelectedRecordId(null)} />
        </div>
    );
};

export default MedicalRecordList;