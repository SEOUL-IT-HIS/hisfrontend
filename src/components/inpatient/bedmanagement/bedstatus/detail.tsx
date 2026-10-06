"use client";

import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";
import { fetchBedDetailRequest, selectBedDetail, selectBedDetailStatus } from "@/features/inpatient/bedmanagement/bedstatus/slice";
import { fetchPatientDetailRequest } from "@/features/patient/slice/patientSlice";
import type { AppDispatch, RootState } from "@/store/store";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { formatBedLabel, formatSexAge } from "@/features/inpatient/displayFormat";
import { formatDateTime } from "@/features/inpatient/dateLimits";
import { Alert, Button, Select } from "@/components/common";
import SectionCard, { InfoRow } from "@/components/inpatient/common/SectionCard";

const STATUS_BADGE: Record<string, string> = {
    EMPTY: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
    OCCUPIED: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
    RESERVED: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
};

const STATUS_LABEL: Record<string, string> = {
    EMPTY: "Empty",
    OCCUPIED: "Occupied",
    RESERVED: "Reserved",
};

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
    const { options: wardOptions } = useCommonCodeOptions("WARD_CD");
    const [roomTypeCode, setRoomTypeCode] = useState(bed?.roomTypeCode ?? "");
    const [wardCd, setWardCd] = useState(bed?.wardCd ?? "");
    useEffect(() => {
        if (!bedId) return;
        dispatch(fetchBedDetailRequest(bedId));
    }, [bedId, dispatch]);

    useEffect(() => {
        if (!bed?.patientId) return;
        dispatch(fetchPatientDetailRequest(bed.patientId));
    }, [bed?.patientId, dispatch]);

    // 서버 값(bed)이 바뀌면 선택 드롭다운 값도 맞춰줌 — effect 대신 "이전 값 기억 → 렌더링 중 비교" 방식
    // (effect 안에서 setState하면 한 번 더 렌더링되므로 React 권장 방식으로 변경)
    const [prevRoomTypeCode, setPrevRoomTypeCode] = useState(bed?.roomTypeCode);
    if (bed?.roomTypeCode !== prevRoomTypeCode) {
        setPrevRoomTypeCode(bed?.roomTypeCode);
        setRoomTypeCode(bed?.roomTypeCode ?? "");
    }

    const [prevWardCd, setPrevWardCd] = useState(bed?.wardCd);
    if (bed?.wardCd !== prevWardCd) {
        setPrevWardCd(bed?.wardCd);
        setWardCd(bed?.wardCd ?? "");
    }

    const handleSaveWard = () => {
        if (!bedId || !wardCd) return;
        dispatch({type: "bed/updateBedWardRequest", payload: { bedId, wardCd }});
    }
    const handleSaveRoomType = () => {
        if (!bedId || !roomTypeCode) return;
        dispatch({type: "bed/updateBedRoomTypeRequest", payload: { bedId, roomTypeCode }});
    };
    return (
        // 목록 옆에 끼워 넣을 때(onClose 있음)는 여백 없이, 단독 화면일 때만 페이지 여백
        <div className={onClose ? "w-full" : "w-full p-6"}>
            <SectionCard
                title="Bed Status Details"
                // 목록 옆 좁은 패널에서는 설명을 숨겨 제목과 Deselect가 한 줄에 들어가게 함
                description={onClose ? undefined : "Current usage status of the bed."}
                padded={false}
                actions={
                    onClose && (
                        <Button variant="secondary" onClick={onClose} className="!h-8 !px-3">
                            Deselect
                        </Button>
                    )
                }
            >
                {loading && <p className="px-5 py-6 text-sm text-slate-400">Loading...</p>}
                {error && <Alert className="m-4">{error}</Alert>}

                {!loading && bed && (
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-3">
                            <span className="text-sm font-semibold text-slate-800">{formatBedLabel(bed.bedId)}</span>
                            <span
                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                                    STATUS_BADGE[bed.bedStatus] ?? "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
                                }`}
                            >
                                {STATUS_LABEL[bed.bedStatus] ?? bed.bedStatus}
                            </span>
                        </div>
                        <InfoRow label="Patient Name">
                            {bed.patientId ? (patientDetail?.patientId === bed.patientId ? patientDetail.patientName : "Loading...") : "None"}
                        </InfoRow>
                        <InfoRow label="Gender / Age">
                            {bed.patientId && patientDetail?.patientId === bed.patientId
                                ? formatSexAge(patientDetail.genderCd, patientDetail.birthDate)
                                : "-"}
                        </InfoRow>
                        <InfoRow label="Room No.">{bed.roomNo}</InfoRow>
                        <InfoRow label="Bed No.">{bed.bedNo}</InfoRow>
                        <InfoRow label="Room Type">
                            <span className="flex items-center justify-end gap-2">
                                <Select
                                    value={roomTypeCode}
                                    onChange={(e) => setRoomTypeCode(e.target.value)}
                                    placeholder="Select"
                                    options={roomTypeOptions}
                                    className="!h-8 w-40"
                                />
                                <Button onClick={handleSaveRoomType} className="!h-8 !px-3">Save</Button>
                            </span>
                        </InfoRow>
                        <InfoRow label="Ward">
                            <span className="flex items-center justify-end gap-2">
                                <Select
                                    value={wardCd}
                                    onChange={(e) => setWardCd(e.target.value)}
                                    placeholder="Select"
                                    options={wardOptions}
                                    className="!h-8 w-40"
                                />
                                <Button onClick={handleSaveWard} className="!h-8 !px-3">Save</Button>
                            </span>
                        </InfoRow>
                        <InfoRow label="Created At">{formatDateTime(bed.createdAt)}</InfoRow>
                        <InfoRow label="Updated At">{formatDateTime(bed.updatedAt)}</InfoRow>
                    </div>
                )}
            </SectionCard>
        </div>
    );
}
export default BedStatusDetail;
