"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { Alert, Button, Input } from "@/components/common";
import MedicalRecordDetail from "@/components/outpatient/medicalrecord/MedicalRecordDetail";
import { useEmpNames } from "@/features/emp/hooks/useEmpNames";
import { fetchRecordListRequest } from "@/features/outpatient/medicalrecord/slice";
import type { AppDispatch, RootState } from "@/store/store";

// 초진/재진 배지 (초진 연한 파랑, 재진 연한 민트). 값이 없으면 "-"
const VISIT_TYPE_BADGE: Record<string, { label: string; className: string }> = {
    // 초진
    INITIAL: { label: "Initial Visit", className: "bg-[#DEEBFF] text-[#2563EB] ring-[#2563EB]/25" },
    // 재진 (아주 연한 민트)
    REVISIT: { label: "Revisit", className: "bg-[#E0F6EC] text-[#0F766E] ring-[#0F766E]/25" },
};

const VisitTypeBadge = ({ value }: { value?: string | null }) => {
    if (!value) return <span className="text-slate-400">-</span>;
    const badge = VISIT_TYPE_BADGE[value];
    return (
        <span className={`inline-flex min-w-[6rem] justify-center rounded-full px-2.5 py-0.5 text-[13px] font-medium ring-1 ring-inset ${badge?.className ?? "bg-slate-100 text-slate-600 ring-slate-500/20"}`}>
            {badge?.label ?? value}
        </span>
    );
};

const formatDateTime = (value: string) => (value ? value.replace("T", " ").slice(0, 19) : "-");

const MedicalRecordList = () => {
    const dispatch = useDispatch<AppDispatch>();

    const searchParams = useSearchParams();

    // 담당의 empId -> 이름 (ADM 직원 목록 기반, 조회 실패 시 ID 그대로 표시)
    const { names: empNames } = useEmpNames();

    const initialKeyword = searchParams.get("keyword") ?? searchParams.get("patientName") ?? "";

    // 검색어 상태관리 변수명 변경
    const [keywordInput, setKeywordInput] = useState(initialKeyword);
    // 마지막으로 조회한 검색어 (같은 검색어를 중복 조회하지 않기 위함)
    const lastKeywordRef = useRef(initialKeyword.trim());
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

    // 입력하면 0.3초 뒤 자동 검색 (한 글자만 입력해도 조회)
    useEffect(() => {
        const keyword = keywordInput.trim();
        if (keyword === lastKeywordRef.current) return;
        const timer = setTimeout(() => {
            lastKeywordRef.current = keyword;
            setSelectedRecordId(null);
            dispatch(fetchRecordListRequest({ keyword }));
        }, 300);
        return () => clearTimeout(timer);
    }, [dispatch, keywordInput]);

    // 검색 버튼 클릭 시 keyword 전달
    function handleSearch() {
        const keyword = keywordInput.trim();
        lastKeywordRef.current = keyword;
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
        lastKeywordRef.current = "";
        setSelectedRecordId(null);
        dispatch(fetchRecordListRequest({ keyword: "" }));
    }

    return (
        <div className="flex h-full min-h-0 flex-col gap-3 p-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                {/* 진료기록 조회 */}
                <h1 className="text-lg font-bold text-slate-800">Medical Records</h1>

                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        {/* UI 플레이스홀더 및 상태변수 변경 */}
                        <Input
                            id="keyword"
                            autoComplete="off" // 브라우저 이전 입력 기록 제안 끄기
                            value={keywordInput}
                            // 환자명, 주호소 입력
                            placeholder="Enter patient name or chief complaint"
                            onChange={(e) => setKeywordInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                    <Button variant="secondary" onClick={handleReset}>
                        {/* 초기화 */}
                        Reset
                    </Button>
                    <Button variant="primary" onClick={handleSearch}>
                        {/* 조회 */}
                        Search
                    </Button>
                </div>
            </div>

            {error && <Alert variant="error">{error}</Alert>}

            {loading ? (
                // 진료 기록을 불러오는 중입니다...
                <p className="p-4 text-center text-slate-500">Loading medical records...</p>
            ) : (
                <div className="min-h-[450px] overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                    <table className="w-full table-fixed text-left border-collapse text-sm">
                        <thead className="bg-slate-100 border-b border-slate-200 text-slate-700">
                        <tr>
                            {/* 환자 / 의사 / 진료과 / 주호소 / 초재진 / 일시 / 관리 */}
                            {/* 7개 컬럼 균등 너비 (처방 목록과 동일) */}
                            <th className="p-3 font-semibold">Patient</th>
                            <th className="p-3 font-semibold">Doctor</th>
                            <th className="p-3 font-semibold">Department</th>
                            <th className="p-3 font-semibold">Chief Complaint</th>
                            <th className="p-3 font-semibold"><span className="inline-block w-24 text-center">Visit Type</span></th>
                            <th className="p-3 font-semibold">Created At</th>
                            <th className="p-3 font-semibold"><span className="sr-only">Actions</span></th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-800">
                        {list && list.length > 0 ? (
                            list.map((record) => (
                                <tr key={record.recordId} className="hover:bg-slate-50 transition">
                                    <td className="p-3">{record.patientName ?? "Unknown"}</td>
                                    <td className="p-3">
                                        {record.doctorName || empNames[record.doctorId] || record.doctorId || "-"}
                                    </td>
                                    <td className="p-3">{record.departmentName || record.departmentCode || "-"}</td>
                                    <td className="p-3 truncate">{record.chiefComplaint ?? "-"}</td>
                                    <td className="p-3"><VisitTypeBadge value={record.visitType} /></td>
                                    <td className="p-3">{formatDateTime(record.createdAt)}</td>
                                    <td className="p-3 text-left">
                                        <Button
                                            variant="primary"
                                            onClick={() => setSelectedRecordId(record.recordId)}
                                        >
                                            {/* 상세보기 */}
                                            View
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="p-6 text-center text-slate-500">
                                    {/* 조회된 진료 기록이 없습니다. */}
                                    No medical records found.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            )}

            <MedicalRecordDetail
                recordId={selectedRecordId}
                doctorNames={empNames}
                onClose={() => setSelectedRecordId(null)}
            />
        </div>
    );
};

export default MedicalRecordList;
