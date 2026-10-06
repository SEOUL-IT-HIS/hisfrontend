"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { SearchBar, Input, DataTable, Pagination } from "@/components/common";
import DownSelect from "@/components/emergency/common/DownSelect";
import type { DataTableColumn } from "@/components/common/DataTable";
import KtasLevelBadge from "@/components/emergency/receptionList/KtasLevelBadge";
import {
    fetchReceptionListRequest,
    refreshReceptionListRequest,
    selectReceptionListItems,
    selectReceptionListLoading,
} from "@/features/emergency/receptionList/slice";
import { RECEPTION_LIST_POLL_INTERVAL_MS, type ReceptionListItem } from "@/features/emergency/receptionList/types";
import { BED_ZONE_OPTIONS } from "@/features/emergency/resource/bed/types";
import type { AppDispatch } from "@/store/store";
import { selectDispositionByReceptionId } from "@/features/emergency/disposition/slice";
import { selectAdmissionsByDisposition, selectTransfersByDisposition } from "@/features/emergency/disposition/followup/slice";

/** 목록 상태 필터 — 저장 코드가 아니라 백엔드가 퇴실 처리 진행에 따라 계산하는 값 */
const STATUS_OPTIONS = [
    // 진료 중(기본): 퇴실 결정 전, 또는 입원/전원 후속 처리가 끝나기 전
    { value: "IN_CARE", label: "In Care" },
    // 퇴실 처리 완료
    { value: "DONE", label: "Done" },
    // 접수에서 취소한 접수
    { value: "CANCELLED", label: "Cancelled" },
    // 전체
    { value: "ALL", label: "All" },
];

function zoneLabel(zoneCode: string): string {
    return BED_ZONE_OPTIONS.find((o) => o.value === zoneCode)?.label ?? zoneCode;
}

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
    const [status, setStatus] = useState("IN_CARE");

    // 선택한 환자의 퇴실 결정·입원 회신·전원 소견서가 바뀌면 목록 상태(진료 중/완료)도 다시 불러온다.
    const disposition = useSelector(selectDispositionByReceptionId(activeReceptionNo ?? ""));
    const admissions = useSelector(selectAdmissionsByDisposition(disposition?.id ?? ""));
    const transfers = useSelector(selectTransfersByDisposition(disposition?.id ?? ""));
    const followUpKey = `${disposition?.id ?? ""}|${admissions[0]?.requestStatusCode ?? ""}|${transfers.length}`;

    useEffect(() => {
        dispatch(fetchReceptionListRequest(status === "ALL" ? undefined : status));
    }, [dispatch, status, followUpKey]);

    // 접수에서 새로 들어온 환자·취소를 새로고침 없이 보이게 한다 — 10초마다 조용히 다시 불러온다.
    // 다른 탭·창에 가려진 동안은 멈추고, 다시 보이면 바로 한 번 불러온다.
    useEffect(() => {
        const refreshIfVisible = () => {
            if (document.visibilityState === "visible") dispatch(refreshReceptionListRequest());
        };
        const timer = setInterval(refreshIfVisible, RECEPTION_LIST_POLL_INTERVAL_MS);
        document.addEventListener("visibilitychange", refreshIfVisible);
        return () => {
            clearInterval(timer);
            document.removeEventListener("visibilitychange", refreshIfVisible);
        };
    }, [dispatch]);

    // 백엔드가 접수 시각 오름차순(먼저 접수한 환자 먼저)으로 내려주므로 그 순서를 그대로 쓴다.
    // (접수ID 는 UUID 라 정렬 기준으로 쓰면 접수 순서와 무관하게 뒤섞인다)
    const sortedItems = items;
    // patientName은 환자서비스 배치조회 붙기 전까지 null일 수 있다(정상).
    // 검색어가 비어있으면(기본 상태) 이름 유무와 상관없이 전부 통과시켜야 한다 —
    // null?.includes("") 는 undefined 라 그냥 두면 검색 안 한 상태에서도 이름 없는 건이
    // 전부 걸러져버리는 버그가 났었다(실제로 겪음).
    const filtered = sortedItems.filter(
        (item) => keyword === "" || (item.patientName?.includes(keyword) ?? false),
    );
    const totalPages = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1);
    // 자동 갱신으로 목록이 줄면 보던 페이지가 없어질 수 있다 — 마지막 페이지로 맞춘다
    const currentPage = Math.min(page, totalPages);
    const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const columns: DataTableColumn<ReceptionListItem>[] = [
        { key: "ktas", header: "KTAS", render: (r) => <KtasLevelBadge level={r.ktasLevelCode} /> },

        // 환자명 — 환자서비스 배치조회 붙기 전까지는 null일 수 있음(정상)
        {
            key: "patientName",
            header: "Patient Name",
            render: (r) => (
                <span className="inline-flex items-center gap-1.5">
                    {r.patientName ?? "-"}
                    {r.careStatusCode === "CANCELLED" ? (
                        // 접수에서 취소한 접수
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">Cancelled</span>
                    ) : null}
                </span>
            ),
        },

        // 병상/구역 — 외래 "진료과" 컬럼에 대응. 미배정이면 "-"
        {
            key: "bed",
            header: "Bed / Zone",
            render: (r) => (r.bedNo ? `${r.bedNo} (${zoneLabel(r.zoneCode ?? "")})` : "-"),
        },


    ];

    return (
        <div className="flex h-[calc(100vh-180px)] flex-col gap-3">
            {/* 조회 / 초기화 — 공용 SearchBar 기본값(한글)을 이 화면에서만 영어로 덮어씀 */}
            <SearchBar
                onSearch={() => setPage(1)}
                searchLabel="Search"
                onReset={() => { setKeyword(""); setPage(1); }}
                resetLabel="Reset"
            >
                <DownSelect
                    label="Status"
                    hideLabel
                    value={status}
                    onChange={(value) => { setStatus(value); setPage(1); }}
                    options={STATUS_OPTIONS}
                    className="w-[150px]"
                />
                <Input
                    // 환자명 검색
                    placeholder="Search patient name"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="max-w-[200px]"
                />
            </SearchBar>

            <div className="flex min-h-0 flex-1 flex-col">
                <DataTable
                    columns={columns}
                    rows={paged}
                    rowKey={(r) => r.receptionId}
                    onRowClick={(r) => onSelect(r.receptionId)}
                    isRowActive={(r) => r.receptionId === activeReceptionNo}
                    loading={loading}
                    // 오늘 접수된 응급 환자가 없습니다.
                    emptyMessage={
                        status === "DONE"
                            ? "No discharged patients."
                            : status === "CANCELLED"
                              ? "No cancelled receptions."
                              : "No emergency patients in care."
                    }
                    minWidthClassName="min-w-0"
                    className="!rounded-b-none !border-b-0 !shadow-none"
                />
                <div className="flex justify-center rounded-b-2xl border border-t-0 border-slate-200/80 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                    {/* 이전 / 다음 — 공용 Pagination 기본값(한글)을 이 화면에서만 영어로 덮어씀 */}
                    <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} prevLabel="Previous" nextLabel="Next" />
                </div>
            </div>
        </div>
    );
}