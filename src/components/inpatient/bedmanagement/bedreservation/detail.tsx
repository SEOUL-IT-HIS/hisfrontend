"use client";

import { fetchBedReservationDetailRequest,deleteBedReservationRequest } from "@/features/inpatient/bedmanagement/bedreservation/slice";
import { fetchPatientDetailRequest } from "@/features/patient/slice/patientSlice";
import { RootState } from "@/store/store";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

// 예약 상태 코드(reservationStatusCd) → 배지 색상
const STATUS_BADGE: Record<string, string> = {
    REQUESTED: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
    RESERVED: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
    RELEASED: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
};

// 예약 상태 코드 → 화면에 보여줄 한글 라벨
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
    // 목록 옆에 끼워 넣을 때는 prop으로, 단독 라우트(/bedreservation/[id])로 열렸을 때는 URL 파라미터로 id를 받음
    const routeParams = useParams() as { bedReservationId?: string };
    const bedReservationId = bedReservationIdProp ?? Number(routeParams.bedReservationId);
    const bedReservation = useSelector((state: RootState) => state.inpatient.bedreservation.detail);
    const updateStatus = useSelector((state: RootState) => state.inpatient.bedreservation.updateStatus);
    const deleteStatus = useSelector((state: RootState) => state.inpatient.bedreservation.deleteStatus);
    const scheduleUpdateStatus = useSelector((state: RootState) => state.inpatient.bedreservation.scheduleUpdateStatus);
    // 서버에서 받아온 예약 데이터(bedReservation)와는 별개로, "일정 변경" 폼에서 입력 중인 값만 따로 관리
    const [scheduleForm, setScheduleForm] = useState({ reserveAt: "", expectedAdmissionAt: "" });
    const { loading, error } = useSelector((state: RootState) => state.inpatient.bedreservation.detailStatus);
    const patientDetail = useSelector((state: RootState) => state.patient.patientDetail);

    // ① 일정 변경(handleUpdateSchedule) 성공 시 최신 예약 정보를 다시 불러와 화면에 반영
    useEffect(() => {
        if (scheduleUpdateStatus.success && bedReservationId) {
            dispatch(fetchBedReservationDetailRequest(bedReservationId));
        }
    }, [scheduleUpdateStatus.success, bedReservationId]);

    // ② 화면이 열리거나(목록에서 다른 예약 클릭 등) bedReservationId가 바뀔 때마다 상세 정보를 조회
    useEffect(() => {
        if (!bedReservationId) return;
        dispatch(fetchBedReservationDetailRequest(bedReservationId));
    }, [bedReservationId]);

    // ③ ②에서 받아온 예약 정보 안의 patientId로, 환자 이름 등을 조회하는 두 번째 API 호출
    //    (②가 끝나기 전엔 patientId를 모르므로 별도 useEffect로 분리)
    useEffect(() => {
        if (!bedReservation?.patientId) return;
        dispatch(fetchPatientDetailRequest(bedReservation.patientId));
    }, [bedReservation?.patientId]);

    // ④ 예약 자체를 수정하는 updateBedReservationRequest 성공 시 재조회
    //    단, 이 파일 안에서 updateBedReservationRequest를 직접 dispatch하는 곳은 없음 —
    //    다른 화면에서 이 예약을 수정했을 경우를 대비한 것으로 보이나, 실제 호출부가 없다면 죽은 코드일 수 있음
    useEffect(() => {
        if (updateStatus.success && bedReservationId) {
            dispatch(fetchBedReservationDetailRequest(bedReservationId));
        }
    }, [updateStatus.success, bedReservationId]);

    // ⑤ 서버 상태(bedReservation)가 바뀔 때마다, 그 값을 "일정 변경" 폼의 입력값으로 복사
    //    (서버 데이터와 폼 입력 상태는 별개의 state라 동기화가 필요함)
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

    // 일정만 바꾸는 전용 액션이라 액션 생성자(action creator) 없이 type 문자열을 직접 dispatch
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
                {/* 목록 옆에 끼워 넣었을 때(onClose가 전달된 경우)만 노출 */}
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
                    {/* 기본 정보 카드 */}
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                            <span className="text-sm font-medium text-slate-800">
                                {/*
                                  환자ID가 없으면 "없음",
                                  있는데 아직 ③번 useEffect의 조회 결과(patientDetail)가 이 예약의 patientId와 안 맞으면 "조회중...",
                                  둘 다 맞아떨어지면 실제 이름 표시
                                */}
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

                    {/* 일정 변경 카드 — scheduleForm(로컬 입력값)을 수정하고 저장 시 handleUpdateSchedule 호출 */}
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

                    {/* 삭제 카드 */}
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
