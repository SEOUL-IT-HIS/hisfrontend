"use client";

import { ADMISSION_REQUEST_STATUS } from "@/features/outpatient/admissionrequest/types";

// 상태코드 -> 화면 라벨 (공통코드 ADMISSION_REQUEST_STATUS_CD). 모르는 코드는 서버가 준 이름/코드를 그대로 쓴다
export const ADMISSION_STATUS_LABEL: Record<string, string> = {
    [ADMISSION_REQUEST_STATUS.REQUESTED]: "Requested", // 요청됨
    [ADMISSION_REQUEST_STATUS.BED_ASSIGNED]: "Bed Assigned", // 병상 배정
    [ADMISSION_REQUEST_STATUS.REJECTED]: "Rejected", // 거부
};

export const ADMISSION_STATUS_BADGE_CLASS: Record<string, string> = {
    [ADMISSION_REQUEST_STATUS.REQUESTED]: "bg-amber-50 text-amber-700 border-amber-200",
    [ADMISSION_REQUEST_STATUS.BED_ASSIGNED]: "bg-emerald-50 text-emerald-700 border-emerald-200",
    [ADMISSION_REQUEST_STATUS.REJECTED]: "bg-red-50 text-red-600 border-red-200",
};

// 환자 목록처럼 좁은 곳에서 쓰는 짧은 라벨 (패널은 위의 전체 라벨을 쓴다)
const ADMISSION_STATUS_SHORT_LABEL: Record<string, string> = {
    [ADMISSION_REQUEST_STATUS.REQUESTED]: "Requested", // 요청됨
    [ADMISSION_REQUEST_STATUS.BED_ASSIGNED]: "Assigned", // 병상 배정
    [ADMISSION_REQUEST_STATUS.REJECTED]: "Rejected", // 거부
};

export const ADMISSION_DEFAULT_BADGE_CLASS = "bg-slate-100 text-slate-600 border-slate-200";

// 환자 목록 배지의 점(dot) 색 — 진료 상태 알약과 구분되도록 점만 색을 쓴다
const ADMISSION_STATUS_DOT_CLASS: Record<string, string> = {
    [ADMISSION_REQUEST_STATUS.REQUESTED]: "bg-amber-500",
    [ADMISSION_REQUEST_STATUS.BED_ASSIGNED]: "bg-emerald-500",
    [ADMISSION_REQUEST_STATUS.REJECTED]: "bg-red-500",
};
const ADMISSION_DEFAULT_DOT_CLASS = "bg-slate-400";

type AdmissionRequestStatusBadgeProps = {
    // 입원요청 상태코드 (ADMISSION_REQUEST_STATUS 값)
    status: string;
    // 서버가 준 상태명 (모르는 코드일 때 라벨 대신 사용)
    name?: string | null;
};

/**
 * 환자 목록에서 진료의 입원요청 상태를 보여주는 배지.
 * 진료 상태(색이 채워진 알약)와 다른 정보라는 게 보이도록, 흰 배경 + 얇은 테두리 + 색 점 + 검은 글자로 그린다.
 * 좁은 목록에 맞춰 짧은 라벨만 보여주고, 무엇의 상태인지는 마우스를 올리면 툴팁으로 알려준다.
 * 거부(Rejected)는 의사가 알아채고 재요청해야 해서 테두리를 빨갛게 하고 글자를 굵게 해 강조한다.
 */
const AdmissionRequestStatusBadge = ({ status, name }: AdmissionRequestStatusBadgeProps) => {
    const label = ADMISSION_STATUS_SHORT_LABEL[status] ?? name ?? status;
    const fullLabel = ADMISSION_STATUS_LABEL[status] ?? name ?? status;
    const dotClass = ADMISSION_STATUS_DOT_CLASS[status] ?? ADMISSION_DEFAULT_DOT_CLASS;
    const borderClass =
        status === ADMISSION_REQUEST_STATUS.REJECTED ? "border-red-300 font-semibold" : "border-slate-200";

    return (
        <span
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border bg-white px-2 py-1 text-xs text-slate-800 ${borderClass}`}
            title={`Admission request: ${fullLabel}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} aria-hidden="true" />
            {label}
        </span>
    );
};

export default AdmissionRequestStatusBadge;
