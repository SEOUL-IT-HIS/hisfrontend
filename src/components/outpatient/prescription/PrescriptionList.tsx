"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { Alert, Button, Input } from "@/components/common";
import PrescriptionDetail from "@/components/outpatient/prescription/PrescriptionDetail";
import { fetchPrescriptionListRequest } from "@/features/outpatient/prescription/slice";
import type { AppDispatch, RootState } from "@/store/store";

const getStatusText = (status: string) => {
    switch (status) {
        case 'REQUESTED':
        case 'ORDERED':
        case 'PENDING':
            return '처방대기';
        case 'ISSUED':
        case 'IN_PROGRESS':
            return '처방중';
        case 'COMPLETED':
            return '처방완료';
        case 'HOLD':
            return '보류';
        case 'DISCONTINUED':
            return '중단';
        case 'CANCELLED':
            return '취소';
        default:
            return status; // 정의되지 않은 값이면 원본 출력
    }
};

const formatDateTime = (value?: string | null) => (value ? value.replace("T", " ").slice(0, 19) : "-");

const PrescriptionList = () => {
    const dispatch = useDispatch<AppDispatch>();

    const searchParams = useSearchParams();
    const initialKeyword = searchParams.get("keyword") ?? "";

    const [keywordInput, setKeywordInput] = useState(initialKeyword);
    const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string | null>(null);

    const { loading, error, list } = useSelector(
        (state: RootState) => ({
            loading: state.outpatient.prescription.listStatus.loading,
            error: state.outpatient.prescription.listStatus.error,
            list: state.outpatient.prescription.list,
        }),
        shallowEqual
    );

    // 초기 로딩 시 keyword 전달
    useEffect(() => {
        dispatch(fetchPrescriptionListRequest({ keyword: initialKeyword }));
    }, [dispatch, initialKeyword]);

    // 조회 버튼 클릭 시 keyword 전달
    function handleSearch() {
        const keyword = keywordInput.trim();
        setSelectedPrescriptionId(null);
        dispatch(fetchPrescriptionListRequest({ keyword }));
    }

    // 엔터키 누를 때도 검색 가능하도록 처리
    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") {
            handleSearch();
        }
    }

    // 초기화 버튼 클릭 시 검색어 비우기
    function handleReset() {
        setKeywordInput("");
        setSelectedPrescriptionId(null);
        dispatch(fetchPrescriptionListRequest({ keyword: "" }));
    }

    return (
        <div className="flex h-full min-h-0 flex-col gap-3 p-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                <h1 className="text-lg font-bold text-slate-800">처방 조회</h1>

                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <Input
                            id="keyword"
                            value={keywordInput}
                            placeholder="환자명 입력"
                            onChange={(e) => setKeywordInput(e.target.value)}
                            onKeyDown={handleKeyDown}
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
                <p className="p-4 text-center text-slate-500">처방 내역을 불러오는 중입니다...</p>
            ) : (
                <div className="min-h-[450px] overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                    <table className="w-full table-fixed text-left border-collapse text-sm">
                        <thead className="bg-slate-100 border-b border-slate-200 text-slate-700">
                        <tr>
                            <th className="w-[120px] p-3 font-semibold">환자명</th>
                            <th className="w-[120px] p-3 font-semibold">진료구분</th>
                            <th className="w-[120px] p-3 font-semibold">우선순위</th>
                            <th className="w-[120px] p-3 font-semibold">상태</th>
                            <th className="w-[120px] p-3 font-semibold">처방일시</th>
                            <th className="w-[120px] p-3 font-semibold">관리</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-800">
                        {list && list.length > 0 ? (
                            list.map((prescription) => (
                                <tr key={prescription.prescriptionId} className="hover:bg-slate-50 transition">
                                    <td className="p-3">{prescription.patientName ?? prescription.patientId}</td>
                                    <td className="p-3">{prescription.serviceType ?? "-"}</td>
                                    <td className="p-3">{prescription.priorityCode ?? "-"}</td>
                                    <td className="p-3">{getStatusText(prescription.status)}</td>
                                    <td className="p-3">{formatDateTime(prescription.prescribedAt)}</td>
                                    <td className="p-3">
                                        <Button
                                            variant="secondary"
                                            onClick={() => setSelectedPrescriptionId(prescription.prescriptionId)}
                                        >
                                            상세보기
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="p-6 text-center text-slate-500">
                                    조회된 처방 내역이 없습니다.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            )}

            <PrescriptionDetail
                prescriptionId={selectedPrescriptionId}
                onClose={() => setSelectedPrescriptionId(null)}
            />
        </div>
    );
};

export default PrescriptionList;
