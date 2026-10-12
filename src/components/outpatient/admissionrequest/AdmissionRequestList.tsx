"use client";

import { useEffect, useState } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { Alert, DataTable, PageHeader, Select } from "@/components/common";
import type { DataTableColumn } from "@/components/common";
import { useEmpNames } from "@/features/emp/hooks/useEmpNames";
import { fetchAdmissionRequestPageRequest } from "@/features/outpatient/admissionrequest/slice";
import {
    ADMISSION_REQUEST_STATUS,
    ADMISSION_SEND_STATUS,
    type AdmissionRequestDto,
} from "@/features/outpatient/admissionrequest/types";
import type { AppDispatch, RootState } from "@/store/store";
import AdmissionRequestStatusBadge from "./AdmissionRequestStatusBadge";

// 한 번에 불러오는 최근 요청 건수 — 페이지를 넘기지 않고 스크롤로 내려 본다 (서버 한도 100건)
const LIST_SIZE = 100;

// 병동 회신(병상 배정/거부)은 비동기로 도착하므로, 화면이 보이는 동안 주기적으로 다시 조회한다
const REFRESH_INTERVAL_MS = 10_000;

// 요청상태 필터 (빈 값 = 전체)
const STATUS_FILTER_OPTIONS = [
    { value: "", label: "All" }, // 전체
    { value: ADMISSION_REQUEST_STATUS.REQUESTED, label: "Requested" }, // 요청됨 (병동 회신 대기)
    { value: ADMISSION_REQUEST_STATUS.BED_ASSIGNED, label: "Bed Assigned" }, // 병상 배정
    { value: ADMISSION_REQUEST_STATUS.REJECTED, label: "Rejected" }, // 거부
];

const formatDateTime = (value?: string | null) => (value ? value.replace("T", " ").slice(0, 16) : "-");

type AdmissionRequestListProps = {
    // true면 다른 화면(탭) 안에 끼워 넣어 쓴다 — 바깥 여백/높이 지정을 빼서 부모 레이아웃을 따른다
    embedded?: boolean;
};

/**
 * 입원요청 목록 — 모든 의사가 보낸 입원 요청을 최신순으로 보여준다.
 * 오늘 환자 목록에 없는 지난 요청의 병동 회신(병상 배정/거부)도 여기서 확인한다.
 */
const AdmissionRequestList = ({ embedded = false }: AdmissionRequestListProps) => {
    const dispatch = useDispatch<AppDispatch>();

    const [requestStatus, setRequestStatus] = useState("");

    // 요청 의사 empId -> 이름 (조회 실패 시 ID 그대로 표시)
    const { names: empNames } = useEmpNames();

    const { pageList, loading, error } = useSelector(
        (state: RootState) => ({
            pageList: state.outpatient.admissionrequest.pageList,
            loading: state.outpatient.admissionrequest.pageStatus.loading,
            error: state.outpatient.admissionrequest.pageStatus.error,
        }),
        shallowEqual
    );

    // 필터가 바뀌면 조회
    useEffect(() => {
        dispatch(
            fetchAdmissionRequestPageRequest({
                requestStatus: requestStatus || undefined,
                page: 0,
                size: LIST_SIZE,
            })
        );
    }, [dispatch, requestStatus]);

    // 화면이 보이는 동안 주기적으로 조용히 갱신 (다시 보이는 순간 한 번 바로 조회)
    useEffect(() => {
        const refresh = () => {
            if (document.visibilityState === "visible") {
                dispatch(
                    fetchAdmissionRequestPageRequest({
                        requestStatus: requestStatus || undefined,
                        page: 0,
                        size: LIST_SIZE,
                        silent: true,
                    })
                );
            }
        };
        const timer = setInterval(refresh, REFRESH_INTERVAL_MS);
        document.addEventListener("visibilitychange", refresh);
        return () => {
            clearInterval(timer);
            document.removeEventListener("visibilitychange", refresh);
        };
    }, [dispatch, requestStatus]);

    const columns: DataTableColumn<AdmissionRequestDto>[] = [
        {
            key: "requestedAt",
            header: "Requested At",
            render: (row) => <span className="whitespace-nowrap text-slate-600">{formatDateTime(row.requestedAt)}</span>,
        },
        {
            key: "patient",
            header: "Patient",
            render: (row) => <span className="font-medium text-slate-800">{row.patientName ?? row.patientId}</span>,
        },
        {
            key: "department",
            header: "Department",
            render: (row) => row.admissionDeptName ?? row.admissionDeptCode,
        },
        {
            key: "requestedBy",
            header: "Requested By",
            render: (row) => empNames[row.requestedBy] ?? row.requestedBy,
        },
        {
            key: "status",
            header: "Status",
            render: (row) => (
                <div className="flex flex-col items-start gap-1">
                    <AdmissionRequestStatusBadge status={row.requestStatus} name={row.requestStatusName} />
                    {/* 회신을 기다리는데 병동으로 전송이 안 된 요청은 따로 알려준다 (진료 화면에서 재전송) */}
                    {row.requestStatus === ADMISSION_REQUEST_STATUS.REQUESTED &&
                        row.sendStatus !== ADMISSION_SEND_STATUS.SENT && (
                            <span className="text-xs font-medium text-red-600">Not sent to the ward</span>
                        )}
                </div>
            ),
        },
        {
            key: "assignedWard",
            header: "Assigned Ward",
            render: (row) => row.assignedWardName ?? row.assignedWardCode ?? "-",
        },
        {
            key: "note",
            header: "Note / Reason",
            render: (row) =>
                row.requestNote || row.rejectReason ? (
                    <div className="flex flex-col gap-0.5">
                        {row.requestNote && <span className="whitespace-pre-wrap text-slate-700">{row.requestNote}</span>}
                        {row.rejectReason && <span className="text-red-600">{row.rejectReason}</span>}
                    </div>
                ) : (
                    "-"
                ),
        },
    ];

    // 조건에 맞는 요청이 한 번에 불러온 건수보다 많으면 최근 건만 보여주고 있음을 알려준다
    const loadedCount = pageList.content.length;
    const countLabel =
        pageList.totalElements > loadedCount
            ? `Showing the latest ${loadedCount} of ${pageList.totalElements} requests`
            : `${pageList.totalElements} requests`;

    return (
        <div className={embedded ? "flex flex-col gap-3" : "flex h-full min-h-0 flex-col gap-3 p-4"}>
            <PageHeader
                title="Admission Requests"
                // 모든 의사가 병동으로 보낸 입원 요청을 최신순으로 보여줍니다.
                description="All admission requests sent to the ward, newest first."
                actions={
                    <Select
                        aria-label="Request status"
                        className="w-44"
                        value={requestStatus}
                        onChange={(event) => setRequestStatus(event.target.value)}
                        options={STATUS_FILTER_OPTIONS}
                    />
                }
            />

            {error && <Alert variant="error">{error}</Alert>}

            <DataTable
                columns={columns}
                rows={pageList.content}
                rowKey={(row) => row.admissionRequestId}
                loading={loading}
                // 입원요청 목록을 불러오는 중입니다...
                loadingMessage="Loading admission requests..."
                // 조회된 입원 요청이 없습니다.
                emptyMessage="No admission requests found."
                minWidthClassName="min-w-[860px]"
            />

            <p className="text-xs text-slate-500">{countLabel}</p>
        </div>
    );
};

export default AdmissionRequestList;
