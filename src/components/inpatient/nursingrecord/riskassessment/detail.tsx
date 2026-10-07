"use client";

import { fetchAdmissionDetailRequest } from "@/features/inpatient/admissiondischarge/slice";
import { ASSESSMENT_TYPE_OPTIONS, RISK_LEVEL_OPTIONS, codeLabel } from "@/features/inpatient/nursingrecord/codes";
import CodeSelect from "@/components/inpatient/nursingrecord/CodeSelect";
import RiskScoreField from "@/components/inpatient/nursingrecord/riskassessment/RiskScoreField";
import { useNurseOptions } from "@/features/inpatient/admissiondischarge/useDoctorOptions";
import NurseSelect from "@/components/inpatient/nursingrecord/NurseSelect";
import {
    fetchRiskAssessmentDetailRequest,
    deleteRiskAssessmentRequest,
    updateRiskAssessmentRequest,
    selectRiskAssessmentDetail,
    selectRiskAssessmentDetailStatus,
    selectRiskAssessmentUpdateStatus,
    selectRiskAssessmentDeleteStatus,
} from "@/features/inpatient/nursingrecord/riskassessment/slice";
import { fetchPatientDetailRequest } from "@/features/patient/slice/patientSlice";
import { RootState } from "@/store/store";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDayEnd, futureTimeError } from "@/features/inpatient/dateLimits";
import { useDispatch, useSelector } from "react-redux";
import { LABEL, FIELD } from "@/components/inpatient/common/styles";
import { Alert, Button, PageHeader } from "@/components/common";
import { InfoRow } from "@/components/inpatient/common/SectionCard";

const RISK_BADGE: Record<string, string> = {
    HIGH: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
    MEDIUM: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
    LOW: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
};

const RISK_LABEL: Record<string, string> = {
    HIGH: "High Risk",
    MEDIUM: "Medium Risk",
    LOW: "Low Risk",
};

const RiskAssessmentDetail = () => {
    // 기록 시각은 미래일 수 없음 — 화면은 오늘까지만 선택, 시각과 입원일 하한은 서버가 검증
    const maxRecordAt = useDayEnd();
    // 기록자 직원 ID(empId) → 간호사 이름 (목록에 없는 예전 숫자 ID 등은 그대로 표시)
    const { nameById: nurseNameById } = useNurseOptions();
    const dispatch = useDispatch();
    const { patientRiskAssessmentId: idParam }: { patientRiskAssessmentId: string } = useParams();
    const patientRiskAssessmentId = idParam;
    const riskAssessment = useSelector(selectRiskAssessmentDetail);
    const updateStatus = useSelector(selectRiskAssessmentUpdateStatus);
    const deleteStatus = useSelector(selectRiskAssessmentDeleteStatus);
    const { loading, error } = useSelector(selectRiskAssessmentDetailStatus);
    const admission = useSelector((state: RootState) => state.inpatient.admissiondischarge.detail);
    // 퇴원 완료된 입원 건의 기록은 조회만 (서버에서도 등록·수정·삭제를 거절함)
    const readOnly = admission?.admissionId === riskAssessment?.admissionId && admission?.status === "DISCHARGED";
    const patientDetail = useSelector((state: RootState) => state.patient.patientDetail);

    const [editForm, setEditForm] = useState({
        assessmentTypeCd: "",
        score: "",
        riskLevelCd: "",
        assessedAt: "",
        assessorId: "",
    });

    useEffect(() => {
        if (!riskAssessment?.admissionId) return;
        dispatch(fetchAdmissionDetailRequest(riskAssessment.admissionId));
    }, [riskAssessment?.admissionId]);

    useEffect(() => {
        if (!admission?.patientId) return;
        dispatch(fetchPatientDetailRequest(admission.patientId));
    }, [admission?.patientId]);

    useEffect(() => {
        if (!patientRiskAssessmentId) return;
        dispatch(fetchRiskAssessmentDetailRequest(patientRiskAssessmentId));
    }, [patientRiskAssessmentId]);

    useEffect(() => {
        if (updateStatus.success && patientRiskAssessmentId) {
            dispatch(fetchRiskAssessmentDetailRequest(patientRiskAssessmentId));
        }
    }, [updateStatus.success, patientRiskAssessmentId]);

    // 서버 값(riskAssessment)이 바뀌면 수정 폼에 복사 — effect 대신 "이전 값 기억 → 렌더링 중 비교" 방식
    // (effect 안에서 setState하면 한 번 더 렌더링되므로 React 권장 방식으로 변경. 초기값 undefined라 첫 렌더링 때도 한 번 복사됨)
    const [prevRiskAssessment, setPrevRiskAssessment] = useState<typeof riskAssessment | undefined>(undefined);
    if (riskAssessment !== prevRiskAssessment) {
        setPrevRiskAssessment(riskAssessment);
        if (riskAssessment) {
            setEditForm({
                assessmentTypeCd: riskAssessment.assessmentTypeCd,
                score: String(riskAssessment.score),
                riskLevelCd: riskAssessment.riskLevelCd,
                assessedAt: new Date(riskAssessment.assessedAt).toISOString().slice(0, 16),
                assessorId: riskAssessment.assessorId ?? "",
            });
        }
    }

    const onEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleDelete = () => {
        if (!patientRiskAssessmentId) return;
        dispatch(deleteRiskAssessmentRequest(patientRiskAssessmentId));
    };

    // 제출 직전 미래 시각 확인 결과 (서버도 같은 기준으로 거절함)
    const [timeError, setTimeError] = useState<string | null>(null);

    const handleUpdate = () => {
        if (!riskAssessment) return;
        const futureError = futureTimeError(editForm.assessedAt, "Assessed at");
        setTimeError(futureError);
        if (futureError) return;
        dispatch(updateRiskAssessmentRequest({
            patientRiskAssessmentId: riskAssessment.patientRiskAssessmentId,
            admissionId: riskAssessment.admissionId,
            assessmentTypeCd: editForm.assessmentTypeCd,
            score: Number(editForm.score),
            riskLevelCd: editForm.riskLevelCd,
            assessedAt: new Date(editForm.assessedAt),
            assessorId: editForm.assessorId, // 직원 ID(empId) 문자열 그대로
        }));
    };

    const patientName = admission?.admissionId === riskAssessment?.admissionId
        ? (patientDetail?.patientId === admission?.patientId ? patientDetail?.patientName : "Loading...")
        : "Loading...";

    return (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6">
            <PageHeader title="Patient Risk Assessment Detail" description="View and manage assessment results." />

            {loading && <p className="text-sm text-slate-400">Loading...</p>}
            {error && <Alert>{error}</Alert>}

            {!loading && riskAssessment && (
                <div className="space-y-4">
                    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-3">
                            <span className="text-sm font-semibold text-slate-800">{patientName}</span>
                            <span
                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                                    RISK_BADGE[riskAssessment.riskLevelCd] ?? "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
                                }`}
                            >
                                {RISK_LABEL[riskAssessment.riskLevelCd] ?? riskAssessment.riskLevelCd}
                            </span>
                        </div>
                        <div>
                            <InfoRow label="Assessment Type Code">{codeLabel(ASSESSMENT_TYPE_OPTIONS, riskAssessment.assessmentTypeCd)}</InfoRow>
                            <InfoRow label="Assessment Score">{riskAssessment.score}</InfoRow>
                            <InfoRow label="Assessment Date/Time">{new Date(riskAssessment.assessedAt).toLocaleString()}</InfoRow>
                            <InfoRow label="Assessed By">{riskAssessment.assessorId ? nurseNameById.get(riskAssessment.assessorId) ?? riskAssessment.assessorId : "-"}</InfoRow>
                            <InfoRow label="Created At">{new Date(riskAssessment.createdAt).toLocaleString()}</InfoRow>
                            <InfoRow label="Updated At">{new Date(riskAssessment.updatedAt).toLocaleString()}</InfoRow>
                        </div>
                    </div>

                    {readOnly && (
                      <Alert variant="info">
                        This admission is discharged. Nursing records can be viewed but not edited or deleted.
                      </Alert>
                    )}
                    {!readOnly && (
                      <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                          <p className="text-sm font-semibold text-slate-800">Edit Risk Assessment</p>
                          <div>
                              <label htmlFor="assessmentTypeCd" className={LABEL}>Assessment Type</label>
                              <CodeSelect id="assessmentTypeCd" name="assessmentTypeCd" value={editForm.assessmentTypeCd} options={ASSESSMENT_TYPE_OPTIONS} onChange={onEditChange} className={FIELD} required={false} />
                          </div>
                          <RiskScoreField assessmentTypeCd={editForm.assessmentTypeCd} value={editForm.score} onChange={onEditChange} required={false} />
                          <div>
                              <label htmlFor="riskLevelCd" className={LABEL}>Risk Level</label>
                              <CodeSelect id="riskLevelCd" name="riskLevelCd" value={editForm.riskLevelCd} options={RISK_LEVEL_OPTIONS} onChange={onEditChange} className={FIELD} required={false} />
                          </div>
                          <div>
                              <label htmlFor="assessedAt" className={LABEL}>Assessment Date/Time</label>
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
export default RiskAssessmentDetail;
