"use client";

import { fetchAdmissionDetailRequest } from "@/features/inpatient/admissiondischarge/slice";
import { MENTAL_STATUS_OPTIONS, YN_OPTIONS, codeLabel } from "@/features/inpatient/nursingrecord/codes";
import CodeSelect from "@/components/inpatient/nursingrecord/CodeSelect";
import { useNurseOptions } from "@/features/inpatient/admissiondischarge/useDoctorOptions";
import NurseSelect from "@/components/inpatient/nursingrecord/NurseSelect";
import {
    fetchNursingAssessmentDetailRequest,
    deleteNursingAssessmentRequest,
    updateNursingAssessmentRequest,
    selectNursingAssessmentDetail,
    selectNursingAssessmentDetailStatus,
    selectNursingAssessmentUpdateStatus,
    selectNursingAssessmentDeleteStatus,
} from "@/features/inpatient/nursingrecord/nursingassessment/slice";
import { fetchPatientDetailRequest } from "@/features/patient/slice/patientSlice";
import { RootState } from "@/store/store";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDayEnd, futureTimeError } from "@/features/inpatient/dateLimits";
import { useDispatch, useSelector } from "react-redux";
import { LABEL, FIELD } from "@/components/inpatient/common/styles";
import { Alert, Button, PageHeader } from "@/components/common";
import { InfoRow } from "@/components/inpatient/common/SectionCard";

const NursingAssessmentDetail = () => {
    // 기록 시각은 미래일 수 없음 — 화면은 오늘까지만 선택, 시각과 입원일 하한은 서버가 검증
    const maxRecordAt = useDayEnd();
    // 기록자 직원 ID(empId) → 간호사 이름 (목록에 없는 예전 숫자 ID 등은 그대로 표시)
    const { nameById: nurseNameById } = useNurseOptions();
    const dispatch = useDispatch();
    const { nursingAssessmentId }: { nursingAssessmentId: string } = useParams();
    const nursingAssessment = useSelector(selectNursingAssessmentDetail);
    const updateStatus = useSelector(selectNursingAssessmentUpdateStatus);
    const deleteStatus = useSelector(selectNursingAssessmentDeleteStatus);
    const { loading, error } = useSelector(selectNursingAssessmentDetailStatus);
    const admission = useSelector((state: RootState) => state.inpatient.admissiondischarge.detail);
    // 퇴원 완료된 입원 건의 기록은 조회만 (서버에서도 등록·수정·삭제를 거절함)
    const readOnly = admission?.admissionId === nursingAssessment?.admissionId && admission?.status === "DISCHARGED";
    const patientDetail = useSelector((state: RootState) => state.patient.patientDetail);

    const [editForm, setEditForm] = useState({
        allergyYn: "",
        allergyDetail: "",
        pastMedicalHistory: "",
        mentalStatusCd: "",
        assessedAt: "",
        assessorId: "",
    });

    useEffect(() => {
        if (!nursingAssessment?.admissionId) return;
        dispatch(fetchAdmissionDetailRequest(nursingAssessment.admissionId));
    }, [nursingAssessment?.admissionId]);

    useEffect(() => {
        if (!admission?.patientId) return;
        dispatch(fetchPatientDetailRequest(admission.patientId));
    }, [admission?.patientId]);

    useEffect(() => {
        if (!nursingAssessmentId) return;
        dispatch(fetchNursingAssessmentDetailRequest(nursingAssessmentId));
    }, [nursingAssessmentId]);

    useEffect(() => {
        if (updateStatus.success && nursingAssessmentId) {
            dispatch(fetchNursingAssessmentDetailRequest(nursingAssessmentId));
        }
    }, [updateStatus.success, nursingAssessmentId]);

    // 서버 값(nursingAssessment)이 바뀌면 수정 폼에 복사 — effect 대신 "이전 값 기억 → 렌더링 중 비교" 방식
    // (effect 안에서 setState하면 한 번 더 렌더링되므로 React 권장 방식으로 변경. 초기값 undefined라 첫 렌더링 때도 한 번 복사됨)
    const [prevNursingAssessment, setPrevNursingAssessment] = useState<typeof nursingAssessment | undefined>(undefined);
    if (nursingAssessment !== prevNursingAssessment) {
        setPrevNursingAssessment(nursingAssessment);
        if (nursingAssessment) {
            setEditForm({
                allergyYn: nursingAssessment.allergyYn,
                allergyDetail: nursingAssessment.allergyDetail,
                pastMedicalHistory: nursingAssessment.pastMedicalHistory,
                mentalStatusCd: nursingAssessment.mentalStatusCd,
                assessedAt: new Date(nursingAssessment.assessedAt).toISOString().slice(0, 16),
                assessorId: nursingAssessment.assessorId ?? "",
            });
        }
    }

    const onEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleDelete = () => {
        if (!nursingAssessmentId) return;
        dispatch(deleteNursingAssessmentRequest(nursingAssessmentId));
    };

    // 제출 직전 미래 시각 확인 결과 (서버도 같은 기준으로 거절함)
    const [timeError, setTimeError] = useState<string | null>(null);

    const handleUpdate = () => {
        if (!nursingAssessment) return;
        const futureError = futureTimeError(editForm.assessedAt, "Assessed at");
        setTimeError(futureError);
        if (futureError) return;
        dispatch(updateNursingAssessmentRequest({
            nursingAssessmentId: nursingAssessment.nursingAssessmentId,
            admissionId: nursingAssessment.admissionId,
            allergyYn: editForm.allergyYn,
            allergyDetail: editForm.allergyDetail,
            pastMedicalHistory: editForm.pastMedicalHistory,
            mentalStatusCd: editForm.mentalStatusCd,
            assessedAt: new Date(editForm.assessedAt),
            assessorId: editForm.assessorId, // 직원 ID(empId) 문자열 그대로
        }));
    };

    const patientName = admission?.admissionId === nursingAssessment?.admissionId
        ? (patientDetail?.patientId === admission?.patientId ? patientDetail?.patientName : "Loading...")
        : "Loading...";

    return (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6">
            <PageHeader title="Patient Nursing Assessment Detail" description="View and manage nursing assessment records." />

            {loading && <p className="text-sm text-slate-400">Loading...</p>}
            {error && <Alert>{error}</Alert>}

            {!loading && nursingAssessment && (
                <div className="space-y-4">
                    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-3">
                            <span className="text-sm font-semibold text-slate-800">{patientName}</span>
                        </div>
                        <div>
                            <InfoRow label="Allergy Yn">{codeLabel(YN_OPTIONS, nursingAssessment.allergyYn)}</InfoRow>
                            <InfoRow label="Allergy Detail">{nursingAssessment.allergyDetail}</InfoRow>
                            <InfoRow label="Past Medical History">{nursingAssessment.pastMedicalHistory}</InfoRow>
                            <InfoRow label="Mental Status Code">{codeLabel(MENTAL_STATUS_OPTIONS, nursingAssessment.mentalStatusCd)}</InfoRow>
                            <InfoRow label="Assessed At">{new Date(nursingAssessment.assessedAt).toLocaleString()}</InfoRow>
                            <InfoRow label="Assessed By">{nursingAssessment.assessorId ? nurseNameById.get(nursingAssessment.assessorId) ?? nursingAssessment.assessorId : "-"}</InfoRow>
                            <InfoRow label="Created At">{new Date(nursingAssessment.createdAt).toLocaleString()}</InfoRow>
                            <InfoRow label="Updated At">{new Date(nursingAssessment.updatedAt).toLocaleString()}</InfoRow>
                        </div>
                    </div>

                    {readOnly && (
                      <Alert variant="info">
                        This admission is discharged. Nursing records can be viewed but not edited or deleted.
                      </Alert>
                    )}
                    {!readOnly && (
                      <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                          <p className="text-sm font-semibold text-slate-800">Edit Nursing Assessment</p>
                          <div>
                              <label htmlFor="allergyYn" className={LABEL}>Allergy</label>
                              <CodeSelect id="allergyYn" name="allergyYn" value={editForm.allergyYn} options={YN_OPTIONS} onChange={onEditChange} className={FIELD} required={false} />
                          </div>
                          <div>
                              <label htmlFor="allergyDetail" className={LABEL}>Allergy Detail</label>
                              <input type="text" id="allergyDetail" name="allergyDetail" value={editForm.allergyDetail} onChange={onEditChange} className={FIELD} />
                          </div>
                          <div>
                              <label htmlFor="pastMedicalHistory" className={LABEL}>Past Medical History</label>
                              <input type="text" id="pastMedicalHistory" name="pastMedicalHistory" value={editForm.pastMedicalHistory} onChange={onEditChange} className={FIELD} />
                          </div>
                          <div>
                              <label htmlFor="mentalStatusCd" className={LABEL}>Mental Status</label>
                              <CodeSelect id="mentalStatusCd" name="mentalStatusCd" value={editForm.mentalStatusCd} options={MENTAL_STATUS_OPTIONS} onChange={onEditChange} className={FIELD} required={false} />
                          </div>
                          <div>
                              <label htmlFor="assessedAt" className={LABEL}>Assessed At</label>
                              <input type="datetime-local" id="assessedAt" name="assessedAt" max={maxRecordAt} value={editForm.assessedAt} onChange={onEditChange} className={FIELD} />
                          </div>
                          <div>
                              <label htmlFor="assessorId" className={LABEL}>Assessor (Nurse)</label>
                              <NurseSelect id="assessorId" name="assessorId" value={editForm.assessorId} onChange={onEditChange} className={FIELD} required={false} />
                          </div>
                          <Button
                              onClick={handleUpdate}
                              disabled={updateStatus.loading}
                          >
                              {updateStatus.loading ? "Updating..." : "Update"}
                          </Button>
                          {timeError && <Alert>{timeError}</Alert>}
                          {updateStatus.error && <Alert>{updateStatus.error}</Alert>}
                          {updateStatus.success && <Alert variant="success">Update completed</Alert>}
                      </div>
                    )}

                    {!readOnly && (
                      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                          <Button variant="danger"
                              onClick={handleDelete}
                              disabled={deleteStatus.loading}
                          >
                              {deleteStatus.loading ? "Deleting..." : "Delete"}
                          </Button>
                          {deleteStatus.error && <Alert className="mt-3">{deleteStatus.error}</Alert>}
                      </div>
                    )}
                </div>
            )}
        </div>
    );
}
export default NursingAssessmentDetail;
