"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { Alert, Button, Input, Select } from "@/components/common";
import PrescriptionDetail from "@/components/outpatient/prescription/PrescriptionDetail";
import { useEmpNames } from "@/features/emp/hooks/useEmpNames";
import { fetchPrescriptionListRequest } from "@/features/outpatient/prescription/slice";
import { getServiceTypeLabel } from "@/features/outpatient/prescription/serviceType";
import type { AppDispatch, RootState } from "@/store/store";

const getStatusText = (status: string) => {
    switch (status) {
        case 'ORDERED':
            return 'Ordered'; // 처방됨
        case 'REQUESTED':
        case 'PENDING':
            return 'Pending'; // 처방대기
        case 'ISSUED':
        case 'IN_PROGRESS':
            return 'In Progress'; // 처방중
        case 'COMPLETED':
            return 'Completed'; // 처방완료
        case 'HOLD':
            return 'On Hold'; // 보류
        case 'DISCONTINUED':
            return 'Discontinued'; // 중단
        case 'CANCELLED':
            return 'Cancelled'; // 취소
        default:
            return status; // 정의되지 않은 값이면 원본 출력
    }
};

// 상태 필터: 목록의 Status 라벨과 같은 이름 (기본 Ordered, 취소는 선택해서 본다)
const STATUS_FILTER_OPTIONS = [
    { value: "ORDERED", label: "Ordered" },
    { value: "CANCELLED", label: "Cancelled" },
    { value: "ALL", label: "All" },
];

// 처방 상태는 배지 없이 글자색만 (취소/중단 빨강, 보류 노랑, 나머지는 기본색)
const STATUS_TEXT_CLASS: Record<string, string> = {
    CANCELLED: "text-red-600",
    DISCONTINUED: "text-red-600",
    HOLD: "text-amber-600",
    COMPLETED: "text-emerald-600",
    IN_PROGRESS: "text-sky-600",
    ISSUED: "text-sky-600",
};

// 우선순위 배지: STAT 빨강, Urgent 주황, Routine 회색 (모두 같은 모양)
// 코드(01/02/03)와 글자(STAT/URGENT/ROUTINE)를 같은 우선순위로 보고 표기 통일
const PRIORITY_BADGE: Record<string, { label: string; className: string }> = {
    STAT: { label: "STAT", className: "bg-red-100 text-red-700 ring-red-600/30" },
    URGENT: { label: "Urgent", className: "bg-orange-50 text-orange-700 ring-orange-600/20" },
    ROUTINE: { label: "Routine", className: "bg-slate-100 text-slate-600 ring-slate-500/20" },
};
const PRIORITY_BY_CODE: Record<string, string> = { "01": "STAT", "02": "URGENT", "03": "ROUTINE" };

const PriorityCell = ({ name, code }: { name?: string | null; code?: string | null }) => {
    const level = PRIORITY_BY_CODE[code ?? ""] ?? (name || code || "").toUpperCase();
    const badge = PRIORITY_BADGE[level];
    if (!badge) {
        // 모르는 값은 원본 그대로, 값이 없으면 "-"
        return <span className="text-slate-400">{name || code || "-"}</span>;
    }
    return (
        <span className={`inline-flex min-w-[5rem] justify-center rounded-full px-2.5 py-0.5 text-[13px] font-medium ring-1 ring-inset ${badge.className}`}>
            {badge.label}
        </span>
    );
};

const formatDateTime = (value?: string | null) => (value ? value.replace("T", " ").slice(0, 19) : "-");

// 검사결과 배지: null=검사 없음, WAITING=결과 없음, COMPLETE=1건 이상 도착
const LAB_RESULT_BADGE: Record<string, { label: string; className: string }> = {
    WAITING: { label: "Waiting", className: "bg-amber-50 text-amber-700 ring-amber-600/20" },
    COMPLETE: { label: "Complete", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
};

const LabResultBadge = ({ value }: { value?: string | null }) => {
    const badge = value ? LAB_RESULT_BADGE[value] : undefined;
    if (!badge) return <span className="text-slate-400">-</span>;
    return (
        <span className={`inline-flex min-w-[5rem] justify-center rounded-full px-2.5 py-0.5 text-[13px] font-medium ring-1 ring-inset ${badge.className}`}>
            {badge.label}
        </span>
    );
};

const PrescriptionList = () => {
    const dispatch = useDispatch<AppDispatch>();

    const searchParams = useSearchParams();
    const initialKeyword = searchParams.get("keyword") ?? "";

    // 처방자 empId -> 이름 (ADM 직원 목록 기반, 조회 실패 시 ID 그대로 표시)
    const { names: empNames } = useEmpNames();

    const [keywordInput, setKeywordInput] = useState(initialKeyword);
    // 마지막으로 조회한 검색어 (같은 검색어를 중복 조회하지 않기 위함)
    const lastKeywordRef = useRef(initialKeyword.trim());
    const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState("ORDERED");

    const { loading, error, list } = useSelector(
        (state: RootState) => ({
            loading: state.outpatient.prescription.listStatus.loading,
            error: state.outpatient.prescription.listStatus.error,
            list: state.outpatient.prescription.list,
        }),
        shallowEqual
    );

    // 상태 필터 적용 (선택한 상태와 같은 처방만, All 은 전부)
    const filteredList = (list ?? []).filter(
        (prescription) => statusFilter === "ALL" || prescription.status === statusFilter
    );

    // 초기 로딩 시 keyword 전달
    useEffect(() => {
        dispatch(fetchPrescriptionListRequest({ keyword: initialKeyword }));
    }, [dispatch, initialKeyword]);

    // 입력하면 0.3초 뒤 자동 검색 (한 글자만 입력해도 조회)
    useEffect(() => {
        const keyword = keywordInput.trim();
        if (keyword === lastKeywordRef.current) return;
        const timer = setTimeout(() => {
            lastKeywordRef.current = keyword;
            setSelectedPrescriptionId(null);
            dispatch(fetchPrescriptionListRequest({ keyword }));
        }, 300);
        return () => clearTimeout(timer);
    }, [dispatch, keywordInput]);

    // 조회 버튼 클릭 시 keyword 전달
    function handleSearch() {
        const keyword = keywordInput.trim();
        lastKeywordRef.current = keyword;
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
        lastKeywordRef.current = "";
        setStatusFilter("ORDERED");
        setSelectedPrescriptionId(null);
        dispatch(fetchPrescriptionListRequest({ keyword: "" }));
    }

    return (
        <div className="flex h-full min-h-0 flex-col gap-3 p-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                {/* 처방 조회 */}
                <h1 className="text-lg font-bold text-slate-800">Prescriptions</h1>

                {/* [상태 필터] [검색창] [Reset] [Search] */}
                <div className="flex items-center gap-2">
                    <div className="w-36 shrink-0">
                        <Select
                            aria-label="Status filter"
                            options={STATUS_FILTER_OPTIONS}
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setSelectedPrescriptionId(null);
                            }}
                        />
                    </div>
                    <div className="flex-1">
                        <Input
                            id="keyword"
                            autoComplete="off" // 브라우저 이전 입력 기록 제안 끄기
                            value={keywordInput}
                            // 환자명 입력
                            placeholder="Enter patient name"
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
                // 처방 내역을 불러오는 중입니다...
                <p className="p-4 text-center text-slate-500">Loading prescriptions...</p>
            ) : (
                <div className="min-h-[450px] overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                    <table className="w-full table-fixed text-left border-collapse text-sm">
                        <thead className="bg-slate-100 border-b border-slate-200 text-slate-700">
                        <tr>
                            {/* 환자 / 처방자 / 구분 / 순위 / 상태 / 검사 / 일시 / 관리 */}
                            {/* 8개 컬럼 균등 너비 */}
                            <th className="p-3 font-semibold">Patient</th>
                            <th className="p-3 font-semibold">Prescriber</th>
                            <th className="p-3 font-semibold"><span className="inline-block min-w-[4.5rem] text-center">Service Type</span></th>
                            <th className="p-3 font-semibold"><span className="inline-block w-20 text-center">Priority</span></th>
                            <th className="p-3 pl-6 font-semibold">Status</th>
                            <th className="p-3 font-semibold">Lab Result</th>
                            <th className="p-3 font-semibold">Prescribed At</th>
                            <th className="p-3 font-semibold"><span className="sr-only">Actions</span></th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-800">
                        {filteredList.length > 0 ? (
                            filteredList.map((prescription) => (
                                <tr key={prescription.prescriptionId} className="hover:bg-slate-50 transition">
                                    <td className="p-3">{prescription.patientName ?? prescription.patientId}</td>
                                    <td className="p-3">
                                        {empNames[prescription.prescribedBy] ?? prescription.prescribedBy}
                                    </td>
                                    <td className="p-3"><span className="inline-block min-w-[4.5rem] text-center">{getServiceTypeLabel(prescription.serviceType)}</span></td>
                                    <td className="p-3">
                                        <PriorityCell name={prescription.priorityName} code={prescription.priorityCode} />
                                    </td>
                                    <td className="p-3 pl-6">
                                        <span className={STATUS_TEXT_CLASS[prescription.status]}>
                                            {getStatusText(prescription.status)}
                                        </span>
                                    </td>
                                    <td className="p-3"><LabResultBadge value={prescription.labResultStatus} /></td>
                                    <td className="p-3">{formatDateTime(prescription.prescribedAt)}</td>
                                    <td className="p-3 text-left">
                                        <Button
                                            variant="primary"
                                            onClick={() => setSelectedPrescriptionId(prescription.prescriptionId)}
                                        >
                                            {/* 상세보기 */}
                                            View
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} className="p-6 text-center text-slate-500">
                                    {/* 조회된 처방 내역이 없습니다. */}
                                    No prescriptions found.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            )}

            <PrescriptionDetail
                prescriptionId={selectedPrescriptionId}
                prescriberNames={empNames}
                onClose={() => setSelectedPrescriptionId(null)}
            />
        </div>
    );
};

export default PrescriptionList;
