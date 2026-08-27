"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { Alert, Button, Input } from "@/components/common";
import MedicalRecordDetail from "@/components/outpatient/medicalrecord/MedicalRecordDetail";
import { fetchRecordListRequest } from "@/features/outpatient/medicalrecord/slice";
import type { AppDispatch, RootState } from "@/store/store";

const getStatusText = (status: string) => {
    switch (status) {
        case 'WAITING':
        case 'PENDING':
            return '대기중';
        case 'IN_PROGRESS':
            return '진료중';
        case 'COMPLETED':
            return '진료완료';
        default:
            return status; // 정의되지 않은 값이면 원본 출력
    }
};

const formatDateTime = (value: string) => (value ? value.replace("T", " ").slice(0, 19) : "-");

const MedicalRecordList = () => {
    const dispatch = useDispatch<AppDispatch>();

    const searchParams = useSearchParams();

    const initialKeyword = searchParams.get("keyword") ?? searchParams.get("patientName") ?? "";

    // 검색어 상태관리 변수명 변경
    const [keywordInput, setKeywordInput] = useState(initialKeyword);
    const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

    const { loading, error, list } = useSelector(
        (state: RootState) => ({
            loading: state.outpatient.medicalrecord.listStatus.loading,
            error: state.outpatient.medicalrecord.listStatus.error,
            list: state.outpatient.medicalrecord.list,
        }),
        shallowEqual
    );

    // 초기 로딩 시 keyword 전달
    useEffect(() => {
        dispatch(
            fetchRecordListRequest({ keyword: initialKeyword })
        );
    }, [dispatch, initialKeyword]);

    // 검색 버튼 클릭 시 keyword 전달
    function handleSearch() {
        const keyword = keywordInput.trim();
        setSelectedRecordId(null);
        dispatch(fetchRecordListRequest({ keyword }));
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
        setSelectedRecordId(null);
        dispatch(fetchRecordListRequest({ keyword: "" }));
    }

    return (
        <div className="flex h-full min-h-0 flex-col gap-3 p-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                <h1 className="text-lg font-bold text-slate-800">진료기록 조회</h1>

                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        {/* UI 플레이스홀더 및 상태변수 변경 */}
                        <Input
                            id="keyword"
                            value={keywordInput}
                            placeholder="환자명, 주호소 입력"
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
                <p className="p-4 text-center text-slate-500">진료 기록을 불러오는 중입니다...</p>
            ) : (
                <div className="min-h-[450px] overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                    <table className="w-full table-fixed text-left border-collapse text-sm">
                        <thead className="bg-slate-100 border-b border-slate-200 text-slate-700">
                        <tr>
                            <th className="w-[120px] p-3 font-semibold">환자명</th>
                            <th className="w-[120px] p-3 font-semibold">담당의</th>
                            <th className="w-[120px] p-3 font-semibold">주호소</th>
                            <th className="w-[120px] p-3 font-semibold">상태</th>
                            <th className="w-[120px] p-3 font-semibold">작성일시</th>
                            <th className="w-[120px] p-3 font-semibold">관리</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-800">
                        {list && list.length > 0 ? (
                            list.map((record) => (
                                <tr key={record.recordId} className="hover:bg-slate-50 transition">
                                    <td className="p-3">{record.patientName ?? "미상"}</td>
                                    <td className="p-3">
                                        {record.doctorName ? `${record.doctorName}` : (record.doctorId ?? "-")}
                                    </td>
                                    <td className="p-3 truncate">{record.chiefComplaint ?? "-"}</td>
                                    <td className="p-3">{getStatusText(record.status)}</td>
                                    <td className="p-3">{formatDateTime(record.createdAt)}</td>
                                    <td className="p-3">
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