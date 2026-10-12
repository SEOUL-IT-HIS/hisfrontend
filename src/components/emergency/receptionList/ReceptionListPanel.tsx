"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Input, DataTable, Pagination } from "@/components/common";
import DownSelect from "@/components/emergency/common/DownSelect";
import type { DataTableColumn } from "@/components/common/DataTable";
import KtasLevelBadge from "@/components/emergency/receptionList/KtasLevelBadge";
import {
    checkReceptionCancelledRequest,
    fetchReceptionListRequest,
    refreshReceptionListRequest,
    selectReceptionCancelCheck,
    selectReceptionListItems,
    selectReceptionListLoading,
} from "@/features/emergency/receptionList/slice";
import { RECEPTION_CANCEL_RECHECK_MS, RECEPTION_LIST_POLL_INTERVAL_MS, type ReceptionListItem } from "@/features/emergency/receptionList/types";
import { BED_ZONE_OPTIONS } from "@/features/emergency/resource/bed/types";
import { ADMISSION_STATUS, CODE_GROUP, DISPOSITION, optionLabel, toCodeOptions } from "@/features/emergency/codes";
import {
    fetchAllCommonCodesRequest,
    selectCommonCodeLoaded,
    selectCommonCodeLoading,
    selectCommonCodesByGroup,
} from "@/features/emergency/commonCode/slice";
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

/**
 * 목록의 "Status" 열 값 — 접수의 진행 상태를 환자를 열지 않고 알아보게 한다.
 * 접수에서 취소한 접수는 Cancelled, 입원으로 결정한 환자는 병동 회신을 기다리는지·거부됐는지·어느 병동에 배정됐는지를 보인다.
 * 그 밖에는 값이 없다("-"). 거부는 재요청·결정 변경이 필요해 눈에 띄게 표시한다.
 * 같은 환자의 중복 접수 의심(Duplicate?)은 환자 식별에 관한 표시라 이름 옆에 둔다.
 */
function statusCell(
    item: ReceptionListItem,
    wardOptions: ReadonlyArray<{ value: string; label: string }>,
): { text: string; className: string; title: string } | null {
    if (item.careStatusCode === "CANCELLED") {
        return {
            text: "Cancelled",
            className: "bg-slate-100 text-slate-500",
            // 접수에서 취소한 접수입니다.
            title: "This reception was cancelled at reception.",
        };
    }
    if (item.dispositionTypeCode !== DISPOSITION.ADMIT) return null;
    switch (item.admissionStatusCode) {
        case ADMISSION_STATUS.REQUESTED:
            return {
                text: "Waiting",
                className: "bg-sky-50 text-sky-700",
                // 입원요청을 보냈고 병동의 회신을 기다리는 중입니다.
                title: "Admission request sent. Waiting for the ward's reply.",
            };
        case ADMISSION_STATUS.REJECTED:
            return {
                text: "Rejected",
                className: "bg-rose-50 text-rose-700",
                // 병동이 입원요청을 거부했습니다. 다시 요청하거나 퇴실 결정을 바꾸세요.
                title: "The ward rejected the admission request. Request again or change the disposition.",
            };
        case ADMISSION_STATUS.BED_ASSIGNED: {
            const ward = item.assignedWardCode ? optionLabel(wardOptions, item.assignedWardCode) : "";
            return {
                text: ward || "Assigned",
                className: "bg-emerald-50 text-emerald-700",
                // 병동이 병상을 배정했습니다.
                title: "The ward assigned a bed.",
            };
        }
        default:
            return {
                text: "Request not sent",
                className: "bg-amber-50 text-amber-700",
                // 입원으로 결정했지만 입원요청을 아직 보내지 않았습니다.
                title: "Admit was decided but the admission request has not been sent yet.",
            };
    }
}

/** 목록 칸 — 왼쪽 목록 폭이 좁아(최소 320px) 칸 여백을 줄이고(!px-2), 긴 값은 줄바꿈을 허용해(!whitespace-normal) 가로 스크롤을 막는다 */
const CELL_COMPACT = "!px-1.5";
const CELL_WRAP = "!px-2 !whitespace-normal";

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

    // 입원 배지의 병동 이름은 admin 공통코드(WARD_CD)에서 읽는다
    const commonCodeLoaded = useSelector(selectCommonCodeLoaded);
    const commonCodeLoading = useSelector(selectCommonCodeLoading);
    const wardCodes = useSelector(selectCommonCodesByGroup(CODE_GROUP.WARD));
    const wardOptions = toCodeOptions(wardCodes, []);
    useEffect(() => {
        if (!commonCodeLoaded && !commonCodeLoading) dispatch(fetchAllCommonCodesRequest());
    }, [dispatch, commonCodeLoaded, commonCodeLoading]);

    // 선택한 환자의 퇴실 결정·입원 회신·전원 소견서가 바뀌면 목록 상태(진료 중/완료)도 다시 불러온다.
    const disposition = useSelector(selectDispositionByReceptionId(activeReceptionNo ?? ""));
    const admissions = useSelector(selectAdmissionsByDisposition(disposition?.id ?? ""));
    const transfers = useSelector(selectTransfersByDisposition(disposition?.id ?? ""));
    const followUpKey = `${disposition?.id ?? ""}|${admissions[0]?.requestStatusCode ?? ""}|${transfers.length}`;

    useEffect(() => {
        dispatch(fetchReceptionListRequest(status === "ALL" ? undefined : status));
    }, [dispatch, status, followUpKey]);

    // 선택해 둔 환자가 (목록 갱신으로) 목록에서 사라졌으면 접수에서 취소된 것인지 확인한다 — 화면에 안내를 띄우기 위해서다.
    // 퇴실로 Done 이 되었거나 직접 바꾼 필터 때문에 안 보이는 경우에도 묻지만 결과가 취소가 아니면 아무 안내도 하지 않는다.
    // 취소가 아니라는 결과는 1분 뒤에 다시 확인한다(그 사이 취소될 수 있다). 취소로 확인되면 더 묻지 않는다.
    const cancelCheck = useSelector(selectReceptionCancelCheck(activeReceptionNo ?? ""));
    const activeInList = items.some((item) => item.receptionId === activeReceptionNo);
    useEffect(() => {
        if (!activeReceptionNo || loading || activeInList) return;
        const needsCheck =
            !cancelCheck ||
            (cancelCheck.state === "active" && Date.now() - cancelCheck.at > RECEPTION_CANCEL_RECHECK_MS) ||
            (cancelCheck.state === "checking" && Date.now() - cancelCheck.at > RECEPTION_CANCEL_RECHECK_MS);
        if (needsCheck) dispatch(checkReceptionCancelledRequest(activeReceptionNo));
    }, [dispatch, activeReceptionNo, loading, activeInList, items, cancelCheck]);

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

    // 같은 환자의 진행 중(IN_CARE) 접수가 둘 이상이면 중복 접수가 의심된다 — 목록에서 눈에 띄게 표시한다
    const duplicatePatientIds = new Set<string>();
    {
        const seen = new Set<string>();
        for (const item of items) {
            if (item.careStatusCode !== "IN_CARE" || !item.patientId) continue;
            if (seen.has(item.patientId)) duplicatePatientIds.add(item.patientId);
            seen.add(item.patientId);
        }
    }

    const columns: DataTableColumn<ReceptionListItem>[] = [
        { key: "ktas", header: "KTAS", className: CELL_COMPACT, render: (r) => <KtasLevelBadge level={r.ktasLevelCode} /> },

        // 환자명 — 환자서비스 배치조회 붙기 전까지는 null일 수 있음(정상)
        {
            key: "patientName",
            header: "Patient Name",
            className: CELL_WRAP,
            render: (r) => (
                <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                    {r.patientName ?? "-"}
                    {r.careStatusCode === "IN_CARE" && r.patientId && duplicatePatientIds.has(r.patientId) ? (
                        // 같은 환자의 진행 중 접수가 둘 이상 — 중복 접수 의심
                        <span
                            className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700"
                            title="This patient has more than one reception in care. It may be a duplicate registration."
                        >
                            Duplicate?
                        </span>
                    ) : null}
                </span>
            ),
        },

        // 병상/구역 — 외래 "진료과" 컬럼에 대응. 미배정이면 "-"
        {
            key: "bed",
            header: "Bed / Zone",
            className: CELL_WRAP,
            render: (r) =>
                r.bedNo ? `${r.bedNo} (${zoneLabel(r.zoneCode ?? "")})` : <span className="text-slate-400">-</span>,
        },

        // 상태 — 접수 취소, 입원으로 결정한 환자의 병동 회신 상태(대기·거부·배정 병동·요청 전). 그 밖에는 "-"
        {
            key: "status",
            header: "Status",
            className: CELL_WRAP,
            render: (r) => {
                const cell = statusCell(r, wardOptions);
                return cell ? (
                    <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${cell.className}`} title={cell.title}>
                        {cell.text}
                    </span>
                ) : (
                    <span className="text-slate-400">-</span>
                );
            },
        },


    ];

    return (
        <div className="flex h-[calc(100vh-180px)] flex-col gap-3">
            {/* 검색줄 — 상태 필터·이름 검색·버튼을 한 줄에 둔다(왼쪽 목록은 폭이 좁아 공용 SearchBar 는 줄이 나뉜다). 아주 좁을 때만 줄바꿈 */}
            <form
                onSubmit={(e) => { e.preventDefault(); setPage(1); }}
                className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            >
                <DownSelect
                    label="Status"
                    hideLabel
                    value={status}
                    onChange={(value) => { setStatus(value); setPage(1); }}
                    options={STATUS_OPTIONS}
                    className="w-[130px] shrink-0"
                />
                <Input
                    // 환자명 검색
                    placeholder="Search patient name"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="min-w-[120px] flex-1"
                />
                <Button type="button" variant="secondary" onClick={() => { setKeyword(""); setPage(1); }}>
                    Reset
                </Button>
                <Button type="submit" variant="primary">
                    Search
                </Button>
            </form>

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