"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import {
    Alert,
    Button,
    DataTable,
    Input,
    PageHeader,
    SearchBar,
} from "@/components/common";
import type { DataTableColumn } from "@/components/common";
import PrescriptionDetail from "@/components/outpatient/prescription/PrescriptionDetail";
import { fetchPrescriptionListRequest } from "@/features/outpatient/prescription/slice";
import type { PrescriptionDto } from "@/features/outpatient/prescription/types";
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

    const columns: DataTableColumn<PrescriptionDto>[] = [
        {
            key: "patient",
            header: "환자명(환자ID)",
            render: (row) => (row.patientName ? `${row.patientName}(${row.patientId})` : row.patientId),
        },
        { key: "serviceType", header: "진료구분", render: (row) => row.serviceType ?? "-" },
        { key: "orderMethod", header: "처방유형", render: (row) => row.orderMethod ?? "-" },
        { key: "priorityCode", header: "우선순위", render: (row) => row.priorityCode ?? "-" },
        { key: "status", header: "상태", render: (row) => getStatusText(row.status) },
        { key: "prescribedAt", header: "처방일시", render: (row) => formatDateTime(row.prescribedAt) },
        {
            key: "actions",
            header: "관리",
            render: (row) => (
                <Button
                    variant="secondary"
                    onClick={() => setSelectedPrescriptionId(row.prescriptionId)}
                >
                    상세보기
                </Button>
            ),
        },
    ];

    return (
        <div className="flex h-full min-h-0 flex-col gap-3 p-4">
            <h1 className="px-1 text-2xl font-bold text-slate-800">처방 조회</h1>

            <SearchBar onSearch={handleSearch} onReset={handleReset}>
                <Input
                    id="keyword"
                    value={keywordInput}
                    placeholder="환자명, 환자ID 입력"
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="max-w-xs"
                />
            </SearchBar>

            {error && <Alert variant="error">{error}</Alert>}

            <DataTable
                columns={columns}
                rows={list}
                rowKey={(row) => row.prescriptionId}
                loading={loading}
                loadingMessage="처방 내역을 불러오는 중입니다..."
                emptyMessage="조회된 처방 내역이 없습니다."
            />

            <PrescriptionDetail
                prescriptionId={selectedPrescriptionId}
                onClose={() => setSelectedPrescriptionId(null)}
            />
        </div>
    );
};

export default PrescriptionList;
