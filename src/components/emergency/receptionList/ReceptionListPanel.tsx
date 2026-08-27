"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { SearchBar, Input, DataTable, Pagination } from "@/components/common";
import type { DataTableColumn } from "@/components/common/DataTable";
import KtasLevelBadge from "@/components/emergency/receptionList/KtasLevelBadge";
import {
    fetchReceptionListRequest,
    selectReceptionListItems,
    selectReceptionListLoading,
} from "@/features/emergency/receptionList/slice";
import type { ReceptionListItem } from "@/features/emergency/receptionList/types";
import type { AppDispatch } from "@/store/store";

const PAGE_SIZE = 10;

type ReceptionListPanelProps = {
    onSelect: (receptionNo: string) => void;
    activeReceptionNo?: string;
};

export default function ReceptionListPanel({ onSelect, activeReceptionNo }: ReceptionListPanelProps) {
    const dispatch = useDispatch<AppDispatch>();
    const items = useSelector(selectReceptionListItems);
    const loading = useSelector(selectReceptionListLoading);

    const [keyword, setKeyword] = useState("");
    const [page, setPage] = useState(1);

    useEffect(() => {
        dispatch(fetchReceptionListRequest());
    }, [dispatch]);

    const filtered = items.filter((item) => item.patientName.includes(keyword));
    const totalPages = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1);
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const columns: DataTableColumn<ReceptionListItem>[] = [
        { key: "receptionNo", header: "접수번호", render: (r) => r.receptionNo },
        { key: "receivedAt", header: "접수시간", render: (r) => r.receivedAt },
        { key: "patientName", header: "환자명", render: (r) => r.patientName },
        { key: "ktas", header: "KTAS", render: (r) => <KtasLevelBadge level={r.ktasLevel} /> },
    ];

    return (
        <div className="flex h-[calc(100vh-180px)] flex-col gap-3">
            <SearchBar onSearch={() => setPage(1)} onReset={() => { setKeyword(""); setPage(1); }}>
                <Input
                    placeholder="환자명 검색"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="max-w-[200px]"
                />
            </SearchBar>

            <div className="flex min-h-0 flex-1 flex-col">
                <DataTable
                    columns={columns}
                    rows={paged}
                    rowKey={(r) => r.receptionNo}
                    onRowClick={(r) => onSelect(r.receptionNo)}
                    isRowActive={(r) => r.receptionNo === activeReceptionNo}
                    loading={loading}
                    emptyMessage="오늘 접수된 응급 환자가 없습니다."
                    minWidthClassName="min-w-0"
                    className="!rounded-b-none !border-b-0 !shadow-none"
                />
                <div className="flex justify-center rounded-b-2xl border border-t-0 border-slate-200/80 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
            </div>
        </div>
    );
}