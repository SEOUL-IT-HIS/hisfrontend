"use client";

import { fetchBedReservationDetailRequest,deleteBedReservationRequest } from "@/features/inpatient/bedmanagement/bedreservation/slice";
import { fetchPatientDetailRequest } from "@/features/patient/slice/patientSlice";
import { RootState } from "@/store/store";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const STATUS_BADGE: Record<string, string> = {
    REQUESTED: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
    RESERVED: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
    RELEASED: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
};

const STATUS_LABEL: Record<string, string> = {
    REQUESTED: "예약 대기",
    RESERVED: "예약중",
    RELEASED: "해제됨",
};

const INFO_ROW = "flex justify-between border-b border-slate-100 px-4 py-3 text-sm last:border-b-0";
const LABEL = "mb-1 block text-sm font-medium text-slate-700";
const FIELD = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

type BedReservationDetailProps = {
    /** 목록 옆에 끼워 넣을 때 라우트 파라미터 대신 직접 전달 */
    bedReservationId?: number;
    /** 목록 옆에 끼워 넣었을 때만 표시되는 "선택 해제" 버튼 */
    onClose?: () => void;
};

const BedReservationDetail = ({ bedReservationId: bedReservationIdProp, onClose }: BedReservationDetailProps = {}) => {
    const dispatch = useDispatch();
    const routeParams = useParams() as { bedReservationId?: string };
    const bedReservationId = bedReservationIdProp ?? Number(routeParams.bedReservationId);
    const bedReservation = useSelector((state: RootState) => state.inpatient.bedreservation.detail);
    const updateStatus = useSelector((state: RootState) => state.inpatient.bedreservation.updateStatus);
    const deleteStatus = useSelector((state: RootState) => state.inpatient.bedreservation.deleteStatus);
    const scheduleUpdateStatus = useSelector((state: RootState) => state.inpatient.bedreservation.scheduleUpdateStatus);
    const [scheduleForm, setScheduleForm] = useState({ reserveAt: "", expectedAdmissionAt: "" });
    const { loading, error } = useSelector((state: RootState) => state.inpatient.bedreservation.detailStatus);
    const patientDetail = useSelector((state: RootState) => state.patient.patientDetail);

    useEffect(() => {
        if (scheduleUpdateStatus.success && bedReservationId) {
            dispatch(fetchBedReservationDetailRequest(bedReservationId));
        }
    }, [scheduleUpdateStatus.success, bedReservationId]);

    useEffect(() => {
        if (!bedReservationId) return;
        dispatch(fetchBedReservationDetailRequest(bedReservationId));
    }, [bedReservationId]);

    useEffect(() => {
        if (!bedReservation?.patientId) return;
        dispatch(fetchPatientDetailRequest(bedReservation.patientId));
    }, [bedReservation?.patientId]);

    useEffect(() => {
        if (updateStatus.success && bedReservationId) {
            dispatch(fetchBedReservationDetailRequest(bedReservationId));
        }
    }, [updateStatus.success, bedReservationId]);

    useEffect(() => {
        if (bedReservation) {
            setScheduleForm({
                reserveAt: bedReservation.reserveAt,
                expectedAdmissionAt: bedReservation.expectedAdmissionAt,
            });
        }
    }, [bedReservation]);

    const onScheduleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setScheduleForm((prevForm) => ({ ...prevForm, [name]: value }));
    };

    function handleDelete() {
        if (!bedReservationId) return;
        dispatch(deleteBedReservationRequest(bedReservationId));
    }
    function handleUpdateSchedule(reserveAt: string, expectedAdmissionAt: string) {
        if (!bedReservationId) return;
        dispatch({
            type: "bedReservation/updateBedReservationScheduleRequest",
            payload: { id: bedReservationId, reserveAt, expectedAdmissionAt }
        });
    }

    return (
        <div className="w-full p-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-slate-800">병상 예약 상세</h1>
                    <p className="mt-1 text-sm text-slate-500">예약 정보와 일정을 관리합니다.</p>
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

            {!loading && bedReservation && (
                <div className="space-y-4">
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                            <span className="text-sm font-medium text-slate-800">
                                {bedReservation.patientId
                                    ? (patientDetail?.patientId === bedReservation.patientId ? patientDetail.patientName : "조회중...")
                                    : "없음"}
                            </span>
                            <span
                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                                    STATUS_BADGE[bedReservation.reservationStatusCd] ?? "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
                                }`}
                            >
                                {STATUS_LABEL[bedReservation.reservationStatusCd] ?? bedReservation.reservationStatusCd}
                            </span>
                        </div>
                        <div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">예약ID</span>
                                <span className="text-slate-800">{bedReservation.bedReservationId}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">병상ID</span>
                                <span className="text-slate-800">{bedReservation.bedId}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">환자ID</span>
                                <span className="text-slate-800">{bedReservation.patientId}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">예약시각</span>
                                <span className="text-slate-800">{bedReservation.reserveAt}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">예상입원시각</span>
                                <span className="text-slate-800">{bedReservation.expectedAdmissionAt}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-sm font-medium text-slate-800">일정 변경</p>
                        <div>
                            <label htmlFor="reserveAt" className={LABEL}>예약시각</label>
                            <input
                                type="datetime-local"
                                id="reserveAt"
                                name="reserveAt"
                                value={scheduleForm.reserveAt}
                                onChange={onScheduleChange}
                                className={FIELD}
                            />
                        </div>
                        <div>
                            <label htmlFor="expectedAdmissionAt" className={LABEL}>예상입원시각</label>
                            <input
                                type="datetime-local"
                                id="expectedAdmissionAt"
                                name="expectedAdmissionAt"
                                value={scheduleForm.expectedAdmissionAt}
                                onChange={onScheduleChange}
                                className={FIELD}
                            />
                        </div>
                        <button
                            onClick={() => handleUpdateSchedule(scheduleForm.reserveAt, scheduleForm.expectedAdmissionAt)}
                            disabled={scheduleUpdateStatus.loading}
                            className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
                        >
                            {scheduleUpdateStatus.loading ? "일정 업데이트중..." : "일정 업데이트"}
                        </button>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <button
                            onClick={handleDelete}
                            disabled={deleteStatus.loading}
                            className="inline-flex items-center rounded-lg border border-rose-300 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                        >
                            {deleteStatus.loading ? "삭제중..." : "예약 삭제"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BedReservationDetail;
