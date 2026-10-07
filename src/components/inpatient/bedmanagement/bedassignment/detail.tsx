"use client";

import { formatDateTime, toLocalDateTimeString } from "@/features/inpatient/dateLimits";
import { formatBedLabel } from "@/features/inpatient/displayFormat";
import { fetchAdmissionDetailRequest } from "@/features/inpatient/admissiondischarge/slice";
import { fetchBedAssignmentDetailRequest, updateBedAssignmentRequest, resetBedAssignmentUpdateStatus } from "@/features/inpatient/bedmanagement/bedassignment/slice";
import { fetchPatientDetailRequest } from "@/features/patient/slice/patientSlice";
import { RootState } from "@/store/store";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button } from "@/components/common";
import SectionCard, { InfoRow } from "@/components/inpatient/common/SectionCard";


type BedAssignmentDetailProps = {
    /** 목록 옆에 끼워 넣을 때 라우트 파라미터 대신 직접 전달 */
    assignmentId?: number;
    /** 목록 옆에 끼워 넣었을 때만 표시되는 "Deselect" 버튼 */
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
        // 목록 옆에 끼워 넣을 때(onClose 있음)는 여백 없이, 단독 화면일 때만 페이지 여백
        <div className={`flex flex-col gap-4 ${onClose ? "w-full" : "w-full p-6"}`}>
            <SectionCard
                title="Bed Assignment Details"
                // 목록 옆 좁은 패널에서는 설명을 숨겨 제목과 Deselect가 한 줄에 들어가게 함
                description={onClose ? undefined : "Assignment information and bed release status."}
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

                {!loading && bedAssignment && (
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-3">
                            <span className="text-sm font-semibold text-slate-800">{patientName}</span>
                            <span
                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                                    isActive
                                        ? "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200"
                                        : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
                                }`}
                            >
                                {isActive ? "Assigned" : "Released"}
                            </span>
                        </div>
                        <InfoRow label="Bed">{formatBedLabel(bedAssignment.bedId)}</InfoRow>
                        <InfoRow label="Assigned At">{formatDateTime(bedAssignment.assignedAt)}</InfoRow>
                        <InfoRow label="Released At">{formatDateTime(bedAssignment.releasedAt)}</InfoRow>
                        <InfoRow label="Created At">{formatDateTime(bedAssignment.createdAt)}</InfoRow>
                        <InfoRow label="Updated At">{formatDateTime(bedAssignment.updatedAt)}</InfoRow>
                    </div>
                )}
            </SectionCard>

            {!loading && bedAssignment && isActive && (
                <SectionCard title="Release Bed" description="Ends this assignment and frees the bed.">
                    <Button onClick={handleRelease} disabled={updateStatus.loading}>
                        {updateStatus.loading ? "Processing..." : "Release Bed"}
                    </Button>
                    {updateStatus.error && <Alert className="mt-3">{updateStatus.error}</Alert>}
                    {updateStatus.success && <Alert variant="success" className="mt-3">Bed released.</Alert>}
                </SectionCard>
            )}
        </div>
    );
}
export default BedAssignmentDetail;
