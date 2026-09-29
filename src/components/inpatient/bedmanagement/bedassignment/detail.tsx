"use client";

import { fetchAdmissionDetailRequest } from "@/features/inpatient/admissiondischarge/slice";
import { fetchBedAssignmentDetailRequest, updateBedAssignmentRequest, resetBedAssignmentUpdateStatus } from "@/features/inpatient/bedmanagement/bedassignment/slice";
import { fetchPatientDetailRequest } from "@/features/patient/slice/patientSlice";
import { RootState } from "@/store/store";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

const INFO_ROW = "flex justify-between border-b border-slate-100 px-4 py-3 text-sm last:border-b-0";

type BedAssignmentDetailProps = {
    /** 목록 옆에 끼워 넣을 때 라우트 파라미터 대신 직접 전달 */
    assignmentId?: number;
    /** 목록 옆에 끼워 넣었을 때만 표시되는 "선택 해제" 버튼 */
    onClose?: () => void;
};

const BedAssignmentDetail = ({ assignmentId: assignmentIdProp, onClose }: BedAssignmentDetailProps = {}) => {
    const dispatch = useDispatch();
    const routeParams = useParams() as { assignmentId?: string }; // Next.js 라우트 파라미터에서 assignmentId를 가져옵니다.
    const assignmentId = assignmentIdProp ?? Number(routeParams.assignmentId); // assignmentId를 props에서 가져오거나, 라우트 파라미터에서 가져옵니다.
    const bedAssignment = useSelector((state: RootState) => state.inpatient.bedmanagement.detail); // 병상 배정 상세 정보를 가져옵니다.
    const updateStatus = useSelector((state: RootState) => state.inpatient.bedmanagement.updateStatus); // 병상 배정 업데이트 상태를 가져옵니다.
    const { loading, error } = useSelector((state: RootState) => state.inpatient.bedmanagement.detailStatus); // 병상 배정 상세 상태를 가져옵니다.
    const admission = useSelector((state: RootState) => state.inpatient.admissiondischarge.detail); // 입원 상세 정보를 가져옵니다.
    const patientDetail = useSelector((state: RootState) => state.patient.patientDetail); //  환자 상세 정보를 가져옵니다.
    const admissionError = useSelector((state: RootState) => state.inpatient.admissiondischarge.detailStatus.error); // 입원 상세 조회 실패 메시지
    const patientDetailError = useSelector((state: RootState) => state.patient.detailError); // 환자 상세 조회 실패 메시지

    // 다른 배정을 선택하면 이전 배정의 퇴상처리 결과(완료/에러 메시지)를 지움
    // → 안 지우면 A 퇴상 후 B를 눌렀을 때 B에도 "퇴상처리 완료"가 그대로 남아 있음
    useEffect(() => {
        dispatch(resetBedAssignmentUpdateStatus());
    }, [assignmentId]);

    useEffect(() => { 
        if (!bedAssignment?.admissionId) return;  // 병상 배정 정보가 없으면 입원 상세 정보를 가져오지 않습니다.
        dispatch(fetchAdmissionDetailRequest(bedAssignment.admissionId));       // 병상 배정 정보가 있으면 입원 상세 정보를 가져옵니다.
    }, [bedAssignment?.admissionId]); // 병상 배정 정보가 변경될 때마다 입원 상세 정보를 가져옵니다.

    useEffect(() => {
        if (!admission?.patientId) return; //   환자 ID가 없으면 환자 상세 정보를 가져오지 않습니다.
        dispatch(fetchPatientDetailRequest(admission.patientId));  // 환자 ID가 있으면 환자 상세 정보를 가져옵니다.
    }, [admission?.patientId]); //  환자 ID가 변경될 때마다 환자 상세 정보를 가져옵니다.

    useEffect(() => {
        if (!assignmentId) return; //   assignmentId가 없으면 병상 배정 상세 정보를 가져오지 않습니다.
        dispatch(fetchBedAssignmentDetailRequest(assignmentId));  // assignmentId가 있으면 병상 배정 상세 정보를 가져옵니다.
    }, [assignmentId]); // assignmentId가 변경될 때마다 병상 배정 상세 정보를 가져옵니다.

    useEffect(() => {
        if (updateStatus.success && assignmentId) {  // 병상 배정 업데이트가 성공하면 병상 배정 상세 정보를 다시 가져옵니다.
            dispatch(fetchBedAssignmentDetailRequest(assignmentId)); // assignmentId가 있으면 병상 배정 상세 정보를 다시 가져옵니다.
        }
    }, [updateStatus.success, assignmentId]);  //   병상 배정 업데이트 성공 여부와 assignmentId가 변경될 때마다 병상 배정 상세 정보를 다시 가져옵니다.

    // 퇴상시각은 "로컬(한국) 시각" 문자열로 보내야 함.
    // toISOString()은 UTC라서 끝의 Z만 떼고 보내면 백엔드 LocalDateTime이 그걸 한국시각으로 받아 9시간 이르게 저장됨
    // → 시간대 오프셋만큼 보정한 뒤 ISO 문자열로 만들어 "YYYY-MM-DDTHH:mm:ss.sss"(로컬 기준) 형태로 보냄
    const toLocalDateTimeString = (date: Date) =>
        new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, -1);

    const handleRelease = () => {
        if (!bedAssignment) return;
        dispatch(updateBedAssignmentRequest({ ...bedAssignment,
            releasedAt: toLocalDateTimeString(new Date()) }));
    };

    // 환자 이름 표시 — 입원/환자 상세를 "불러오는 중"인 동안은 Loading...으로 두고,
    // 실제로 조회가 실패했을 때만 Not Found를 보여줌 (전에는 로딩 중에도 Not Found가 잠깐 깜빡였음)
    const patientName = (() => {
        if (admission?.admissionId !== bedAssignment?.admissionId) { // 입원 상세가 아직 이 배정 것이 아님
            return admissionError ? "Admission Not Found" : "Loading...";
        }
        if (patientDetail?.patientId !== admission?.patientId) { // 환자 상세가 아직 이 입원 건 환자 것이 아님
            return patientDetailError ? "Patient Not Found" : "Loading...";
        }
        return patientDetail?.patientName;
    })();

    const isActive = bedAssignment?.releasedAt === null;  // 병상 배정이 활성 상태인지 확인

    return (
        <div className="w-full p-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-slate-800">병상 배정 상세</h1>
                    <p className="mt-1 text-sm text-slate-500">배정 정보와 퇴상 처리 상태입니다.</p>
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

            {!loading && bedAssignment && (
                <div className="space-y-4">
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                            <span className="text-sm font-medium text-slate-800">{patientName}</span>
                            <span
                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                                    isActive
                                        ? "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200"
                                        : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
                                }`}
                            >
                                {isActive ? "배정중" : "퇴상완료"}
                            </span>
                        </div>
                        <div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">배정ID</span>
                                <span className="text-slate-800">{bedAssignment.assignmentId}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">병상ID</span>
                                <span className="text-slate-800">{bedAssignment.bedId}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">입원ID</span>
                                <span className="text-slate-800">{bedAssignment.admissionId}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">배정시각</span>
                                <span className="text-slate-800">{bedAssignment.assignedAt}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">퇴상시각</span>
                                <span className="text-slate-800">{bedAssignment.releasedAt ?? "-"}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">생성일시</span>
                                <span className="text-slate-800">{bedAssignment.createdAt}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">수정일시</span>
                                <span className="text-slate-800">{bedAssignment.updatedAt}</span>
                            </div>
                        </div>
                    </div>

                    {isActive && (
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <button
                                onClick={handleRelease}
                                disabled={updateStatus.loading}
                                className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
                            >
                                {updateStatus.loading ? "처리중..." : "퇴상처리"}
                            </button>
                            {updateStatus.error && <p className="mt-2 text-sm text-red-600">{updateStatus.error}</p>}
                            {updateStatus.success && <p className="mt-2 text-sm text-emerald-600">퇴상처리 완료</p>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
export default BedAssignmentDetail;
