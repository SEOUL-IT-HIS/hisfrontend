"use client";

import { fetchAdmissionDetailRequest } from "@/features/inpatient/admissiondischarge/slice";
import { useDoctorOptions } from "@/features/inpatient/admissiondischarge/useDoctorOptions";
import StaffSelect from "@/components/inpatient/nursingrecord/StaffSelect";
import { RESTRAINT_TYPE_OPTIONS, codeLabel } from "@/features/inpatient/nursingrecord/codes";
import CodeSelect from "@/components/inpatient/nursingrecord/CodeSelect";
import { useNurseOptions } from "@/features/inpatient/admissiondischarge/useDoctorOptions";
import NurseSelect from "@/components/inpatient/nursingrecord/NurseSelect";
import {
    fetchRestraintDetailRequest,
    deleteRestraintRequest,
    updateRestraintRequest,
    selectRestraintDetail,
    selectRestraintDetailStatus,
    selectRestraintUpdateStatus,
    selectRestraintDeleteStatus,
} from "@/features/inpatient/nursingrecord/restraint/slice";
import { fetchPatientDetailRequest } from "@/features/patient/slice/patientSlice";
import { RootState } from "@/store/store";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDayEnd, futureTimeError } from "@/features/inpatient/dateLimits";
import { useDispatch, useSelector } from "react-redux";
import { LABEL, FIELD } from "@/components/inpatient/common/styles";
import { Alert, Button, PageHeader } from "@/components/common";
import { InfoRow } from "@/components/inpatient/common/SectionCard";

const RestraintDetail = () => {
    // 기록 시각은 미래일 수 없음 — 화면은 오늘까지만 선택, 시각과 입원일 하한은 서버가 검증
    const maxRecordAt = useDayEnd();
    // 오더 의사 직원 ID(empId) → 의사 이름 (목록에 없는 예전 값은 그대로 표시)
    const { nameById: doctorNameById } = useDoctorOptions();
    // 기록자 직원 ID(empId) → 간호사 이름 (목록에 없는 예전 숫자 ID 등은 그대로 표시)
    const { nameById: nurseNameById } = useNurseOptions();
    const dispatch = useDispatch();
    const { restraintId }: { restraintId: string } = useParams();
    const restraint = useSelector(selectRestraintDetail);
    const updateStatus = useSelector(selectRestraintUpdateStatus);
    const deleteStatus = useSelector(selectRestraintDeleteStatus);
    const { loading, error } = useSelector(selectRestraintDetailStatus);
    const admission = useSelector((state: RootState) => state.inpatient.admissiondischarge.detail);
    // 퇴원 완료된 입원 건의 기록은 조회만 (서버에서도 등록·수정·삭제를 거절함)
    const readOnly = admission?.admissionId === restraint?.admissionId && admission?.status === "DISCHARGED";
    const patientDetail = useSelector((state: RootState) => state.patient.patientDetail);

    const [editForm, setEditForm] = useState({
        restraintTypeCd: "",
        appliedAt: "",
        reason: "",
        doctorOrderId: "",
        evaluatorId: "",
    });

    useEffect(() => {
        if (!restraint?.admissionId) return;
        dispatch(fetchAdmissionDetailRequest(restraint.admissionId));
    }, [restraint?.admissionId]);

    useEffect(() => {
        if (!admission?.patientId) return;
        dispatch(fetchPatientDetailRequest(admission.patientId));
    }, [admission?.patientId]);

    useEffect(() => {
        if (!restraintId) return;
        dispatch(fetchRestraintDetailRequest(restraintId));
    }, [restraintId]);

    useEffect(() => {
        if (updateStatus.success && restraintId) {
            dispatch(fetchRestraintDetailRequest(restraintId));
        }
    }, [updateStatus.success, restraintId]);

    // 서버 값(restraint)이 바뀌면 수정 폼에 복사 — effect 대신 "이전 값 기억 → 렌더링 중 비교" 방식
    // (effect 안에서 setState하면 한 번 더 렌더링되므로 React 권장 방식으로 변경. 초기값 undefined라 첫 렌더링 때도 한 번 복사됨)
    const [prevRestraint, setPrevRestraint] = useState<typeof restraint | undefined>(undefined);
    if (restraint !== prevRestraint) {
        setPrevRestraint(restraint);
        if (restraint) {
            setEditForm({
                restraintTypeCd: restraint.restraintTypeCd,
                appliedAt: new Date(restraint.appliedAt).toISOString().slice(0, 16),
                reason: restraint.reason,
                doctorOrderId: restraint.doctorOrderId,
                evaluatorId: restraint.evaluatorId,
            });
        }
    }

    const onEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleDelete = () => {
        if (!restraintId) return;
        dispatch(deleteRestraintRequest(restraintId));
    };

    // 제출 직전 미래 시각 확인 결과 (서버도 같은 기준으로 거절함)
    const [timeError, setTimeError] = useState<string | null>(null);

    const handleUpdate = () => {
        if (!restraint) return;
        const futureError = futureTimeError(editForm.appliedAt, "Applied at");
        setTimeError(futureError);
        if (futureError) return;
        dispatch(updateRestraintRequest({
            restraintId: restraint.restraintId,
            admissionId: restraint.admissionId,
            restraintTypeCd: editForm.restraintTypeCd,
            appliedAt: new Date(editForm.appliedAt),
            reason: editForm.reason,
            doctorOrderId: editForm.doctorOrderId,
            evaluatorId: editForm.evaluatorId,
        }));
    };

    const patientName = admission?.admissionId === restraint?.admissionId
        ? (patientDetail?.patientId === admission?.patientId ? patientDetail?.patientName : "Loading...")
        : "Loading...";

    return (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6">
            <PageHeader title="Patient Restraint Detail" description="View and manage restraint records." />

            {loading && <p className="text-sm text-slate-400">Loading...</p>}
            {error && <Alert>{error}</Alert>}

            {!loading && restraint && (
                <div className="space-y-4">
                    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-3">
                            <span className="text-sm font-semibold text-slate-800">{patientName}</span>
                        </div>
                        <div>
                            <InfoRow label="Restraint Type Code">{codeLabel(RESTRAINT_TYPE_OPTIONS, restraint.restraintTypeCd)}</InfoRow>
                            <InfoRow label="Applied At">{new Date(restraint.appliedAt).toLocaleString()}</InfoRow>
                            <InfoRow label="Reason">{restraint.reason}</InfoRow>
                            <InfoRow label="Ordering Doctor">{restraint.doctorOrderId ? doctorNameById.get(restraint.doctorOrderId) ?? restraint.doctorOrderId : "-"}</InfoRow>
                            <InfoRow label="Evaluated By">{restraint.evaluatorId ? nurseNameById.get(restraint.evaluatorId) ?? restraint.evaluatorId : "-"}</InfoRow>
                            <InfoRow label="Created At">{new Date(restraint.createdAt).toLocaleString()}</InfoRow>
                            <InfoRow label="Updated At">{new Date(restraint.updatedAt).toLocaleString()}</InfoRow>
                        </div>
                    </div>

                    {readOnly && (
                      <Alert variant="info">
                        This admission is discharged. Nursing records can be viewed but not edited or deleted.
                      </Alert>
                    )}
                    {!readOnly && (
                      <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                          <p className="text-sm font-semibold text-slate-800">Edit Restraint</p>
                          <div>
                              <label htmlFor="restraintTypeCd" className={LABEL}>Restraint Type</label>
                              <CodeSelect id="restraintTypeCd" name="restraintTypeCd" value={editForm.restraintTypeCd} options={RESTRAINT_TYPE_OPTIONS} onChange={onEditChange} className={FIELD} required={false} />
                          </div>
                          <div>
                              <label htmlFor="appliedAt" className={LABEL}>Applied At</label>
                              <input type="datetime-local" id="appliedAt" name="appliedAt" max={maxRecordAt} value={editForm.appliedAt} onChange={onEditChange} className={FIELD} />
                          </div>
                          <div>
                              <label htmlFor="reason" className={LABEL}>Reason</label>
                              <input type="text" id="reason" name="reason" value={editForm.reason} onChange={onEditChange} className={FIELD} />
                          </div>
                          <div>
                              <label htmlFor="doctorOrderId" className={LABEL}>Ordering Doctor</label>
                              <StaffSelect role="DOCTOR" id="doctorOrderId" name="doctorOrderId" value={editForm.doctorOrderId} onChange={onEditChange} className={FIELD} required={false} />
                          </div>
                          <div>
                              <label htmlFor="evaluatorId" className={LABEL}>Evaluator (Nurse)</label>
                              <NurseSelect id="evaluatorId" name="evaluatorId" value={editForm.evaluatorId} onChange={onEditChange} className={FIELD} required={false} />
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
export default RestraintDetail;
