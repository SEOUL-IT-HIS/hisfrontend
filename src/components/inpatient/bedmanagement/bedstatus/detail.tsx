"use client";

import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import { fetchBedDetailRequest, selectBedDetail, selectBedDetailStatus } from "@/features/inpatient/bedmanagement/bedstatus/slice";
import { fetchPatientDetailRequest } from "@/features/patient/slice/patientSlice";
import type { AppDispatch, RootState } from "@/store/store";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const STATUS_BADGE: Record<string, string> = {
    EMPTY: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
    OCCUPIED: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
    RESERVED: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
    MAINTENANCE: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
};

const STATUS_LABEL: Record<string, string> = {
    EMPTY: "빈 병상",
    OCCUPIED: "사용중",
    RESERVED: "예약됨",
    MAINTENANCE: "유지보수",
};

const INFO_ROW = "flex justify-between border-b border-slate-100 px-4 py-3 text-sm last:border-b-0";

type BedStatusDetailProps = {
    /** 목록 옆에 끼워 넣을 때 라우트 파라미터 대신 직접 전달 */
    bedId?: string;
    /** 목록 옆에 끼워 넣었을 때만 표시되는 "선택 해제" 버튼 */
    onClose?: () => void;
};

const BedStatusDetail = ({ bedId: bedIdProp, onClose }: BedStatusDetailProps = {}) => {
    const dispatch = useDispatch<AppDispatch>();
    const routeParams = useParams() as { bedId?: string };
    const bedId = bedIdProp ?? routeParams.bedId ?? "";
    const bed = useSelector(selectBedDetail);
    const { loading, error } = useSelector(selectBedDetailStatus);
    const patientDetail = useSelector((state: RootState) => state.patient.patientDetail);
    const { options: roomTypeOptions } = useCommonCodeOptions("ROOM_TYPE_CD");
    const [roomTypeCode, setRoomTypeCode] = useState(bed?.roomTypeCode ?? "");
    
    useEffect(() => {
        if (!bedId) return;
        dispatch(fetchBedDetailRequest(bedId));
    }, [bedId, dispatch]);

    useEffect(() => {
        if (!bed?.patientId) return;
        dispatch(fetchPatientDetailRequest(bed.patientId));
    }, [bed?.patientId, dispatch]);

    useEffect(() => {
        setRoomTypeCode(bed?.roomTypeCode ?? "");
    }, [bed?.roomTypeCode]);

    const handleSaveRoomType = () => {
        if (!bedId || !roomTypeCode) return;
        dispatch({type: "bed/updateBedRoomTypeRequest", payload: { bedId, roomTypeCode }});
    };
    return (
        <div className="w-full p-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-slate-800">병상 상태 상세</h1>
                    <p className="mt-1 text-sm text-slate-500">병상의 현재 사용 현황입니다.</p>
                </div>
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                    >
                        선택 해제
                    </button>
                )}
            </div>

            {loading && <p className="text-sm text-slate-500">로딩중...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {!loading && bed && (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <span className="text-sm font-medium text-slate-800">{bed.bedId}</span>
                        <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                                STATUS_BADGE[bed.bedStatus] ?? "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
                            }`}
                        >
                            {STATUS_LABEL[bed.bedStatus] ?? bed.bedStatus}
                        </span>
                    </div>
                    <div>
                        <div className={INFO_ROW}>
                            <span className="text-slate-500">환자명</span>
                            <span className="text-slate-800">
                                {bed.patientId ? (patientDetail?.patientId === bed.patientId ? patientDetail.patientName : "조회중...") : "없음"}
                            </span>
                        </div>
                        <div className={INFO_ROW}>
                            <span className="text-slate-500">환자ID</span>
                            <span className="text-slate-800">{bed.patientId ?? "없음"}</span>
                        </div>
                        <div className={INFO_ROW}>
                            <span className="text-slate-500">병실번호</span>
                            <span className="text-slate-800">{bed.roomNo}</span>
                        </div>
                        <div className={INFO_ROW}>
                            <span className="text-slate-500">병상번호</span>
                            <span className="text-slate-800">{bed.bedNo}</span>
                        </div>
                        <div className={INFO_ROW}>
                        <span className="text-slate-500">Room Type</span>
                        <div className="flex items-center gap-2">
                        <select value={roomTypeCode} onChange={(e) => setRoomTypeCode(e.target.value)} className="rounded border border-slate-300 px-2 py-1 text-sm">
                        <option value="">Select</option>
                        {roomTypeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                        </select>
                        <button onClick={handleSaveRoomType} className="rounded bg-sky-600 px-2 py-1 text-xs text-white">Save</button>
                        </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
export default BedStatusDetail;
