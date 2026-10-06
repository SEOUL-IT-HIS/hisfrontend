"use client";

import { fetchAdmissionDetailRequest } from "@/features/inpatient/admissiondischarge/slice";
import { ALL_IO_ROUTE_OPTIONS, IO_ROUTE_OPTIONS, IO_TYPE_OPTIONS, codeLabel } from "@/features/inpatient/nursingrecord/codes";
import CodeSelect from "@/components/inpatient/nursingrecord/CodeSelect";
import { useNurseOptions } from "@/features/inpatient/admissiondischarge/useDoctorOptions";
import NurseSelect from "@/components/inpatient/nursingrecord/NurseSelect";
import {
    fetchIandORecordDetailRequest,
    deleteIandORecordRequest,
    updateIandORecordRequest,
    selectIandORecordDetail,
    selectIandORecordDetailStatus,
    selectIandORecordUpdateStatus,
    selectIandORecordDeleteStatus,
} from "@/features/inpatient/nursingrecord/iandorecord/slice";
import { fetchPatientDetailRequest } from "@/features/patient/slice/patientSlice";
import { RootState } from "@/store/store";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDayEnd, futureTimeError } from "@/features/inpatient/dateLimits";
import { useDispatch, useSelector } from "react-redux";
import { LABEL, FIELD } from "@/components/inpatient/common/styles";
import { Alert, Button, PageHeader } from "@/components/common";
import { InfoRow } from "@/components/inpatient/common/SectionCard";

const IandORecordDetail = () => {
    // 기록 시각은 미래일 수 없음 — 화면은 오늘까지만 선택, 시각과 입원일 하한은 서버가 검증
    const maxRecordAt = useDayEnd();
    // 기록자 직원 ID(empId) → 간호사 이름 (목록에 없는 예전 숫자 ID 등은 그대로 표시)
    const { nameById: nurseNameById } = useNurseOptions();
    const dispatch = useDispatch();
    const { intakeOutputId }: { intakeOutputId: string } = useParams();
    const iandorecord = useSelector(selectIandORecordDetail);
    const updateStatus = useSelector(selectIandORecordUpdateStatus);
    const deleteStatus = useSelector(selectIandORecordDeleteStatus);
    const { loading, error } = useSelector(selectIandORecordDetailStatus);
    const admission = useSelector((state: RootState) => state.inpatient.admissiondischarge.detail);
    // 퇴원 완료된 입원 건의 기록은 조회만 (서버에서도 등록·수정·삭제를 거절함)
    const readOnly = admission?.admissionId === iandorecord?.admissionId && admission?.status === "DISCHARGED";
    const patientDetail = useSelector((state: RootState) => state.patient.patientDetail);

    const [editForm, setEditForm] = useState({
        recordedAt: "",
        ioTypeCd: "",
        routeCd: "",
        amountMl: "",
        recorderId: "",
    });

    useEffect(() => {
        if (!iandorecord?.admissionId) return;
        dispatch(fetchAdmissionDetailRequest(iandorecord.admissionId));
    }, [iandorecord?.admissionId]);

    useEffect(() => {
        if (!admission?.patientId) return;
        dispatch(fetchPatientDetailRequest(admission.patientId));
    }, [admission?.patientId]);

    useEffect(() => {
        if (!intakeOutputId) return;
        dispatch(fetchIandORecordDetailRequest(intakeOutputId));
    }, [intakeOutputId]);

    useEffect(() => {
        if (updateStatus.success && intakeOutputId) {
            dispatch(fetchIandORecordDetailRequest(intakeOutputId));
        }
    }, [updateStatus.success, intakeOutputId]);

    // 서버 값(iandorecord)이 바뀌면 수정 폼에 복사 — effect 대신 "이전 값 기억 → 렌더링 중 비교" 방식
    // (effect 안에서 setState하면 한 번 더 렌더링되므로 React 권장 방식으로 변경. 초기값 undefined라 첫 렌더링 때도 한 번 복사됨)
    const [prevIandorecord, setPrevIandorecord] = useState<typeof iandorecord | undefined>(undefined);
    if (iandorecord !== prevIandorecord) {
        setPrevIandorecord(iandorecord);
        if (iandorecord) {
            setEditForm({
                recordedAt: new Date(iandorecord.recordedAt).toISOString().slice(0, 16),
                ioTypeCd: iandorecord.ioTypeCd,
                routeCd: iandorecord.routeCd,
                amountMl: String(iandorecord.amountMl),
                recorderId: iandorecord.recorderId ?? "",
            });
        }
    }

    const onEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleDelete = () => {
        if (!intakeOutputId) return;
        dispatch(deleteIandORecordRequest(intakeOutputId));
    };

    // 제출 직전 미래 시각 확인 결과 (서버도 같은 기준으로 거절함)
    const [timeError, setTimeError] = useState<string | null>(null);

    const handleUpdate = () => {
        if (!iandorecord) return;
        const futureError = futureTimeError(editForm.recordedAt, "Recorded at");
        setTimeError(futureError);
        if (futureError) return;
        dispatch(updateIandORecordRequest({
            intakeOutputId: iandorecord.intakeOutputId,
            admissionId: iandorecord.admissionId,
            recordedAt: new Date(editForm.recordedAt),
            ioTypeCd: editForm.ioTypeCd,
            routeCd: editForm.routeCd,
            amountMl: Number(editForm.amountMl),
            recorderId: editForm.recorderId, // 직원 ID(empId) 문자열 그대로
        }));
    };

    const patientName = admission?.admissionId === iandorecord?.admissionId
        ? (patientDetail?.patientId === admission?.patientId ? patientDetail?.patientName : "Loading...")
        : "Loading...";

    return (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6">
            <PageHeader title="Patient I&O Record Detail" description="View and manage intake/output records." />

            {loading && <p className="text-sm text-slate-400">Loading...</p>}
            {error && <Alert>{error}</Alert>}

            {!loading && iandorecord && (
                <div className="space-y-4">
                    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-3">
                            <span className="text-sm font-semibold text-slate-800">{patientName}</span>
                        </div>
                        <div>
                            <InfoRow label="Recorded At">{new Date(iandorecord.recordedAt).toLocaleString()}</InfoRow>
                            <InfoRow label="I/O Type Code">{codeLabel(IO_TYPE_OPTIONS, iandorecord.ioTypeCd)}</InfoRow>
                            <InfoRow label="Route Code">{codeLabel(ALL_IO_ROUTE_OPTIONS, iandorecord.routeCd)}</InfoRow>
                            <InfoRow label="Amount (mL)">{iandorecord.amountMl}</InfoRow>
                            <InfoRow label="Recorded By">{iandorecord.recorderId ? nurseNameById.get(iandorecord.recorderId) ?? iandorecord.recorderId : "-"}</InfoRow>
                            <InfoRow label="Created At">{new Date(iandorecord.createdAt).toLocaleString()}</InfoRow>
                            <InfoRow label="Updated At">{new Date(iandorecord.updatedAt).toLocaleString()}</InfoRow>
                        </div>
                    </div>

                    {readOnly && (
                      <Alert variant="info">
                        This admission is discharged. Nursing records can be viewed but not edited or deleted.
                      </Alert>
                    )}
                    {!readOnly && (
                      <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                          <p className="text-sm font-semibold text-slate-800">Edit I&O Record</p>
                          <div>
                              <label htmlFor="recordedAt" className={LABEL}>Recorded At</label>
                              <input type="datetime-local" id="recordedAt" name="recordedAt" max={maxRecordAt} value={editForm.recordedAt} onChange={onEditChange} className={FIELD} />
                          </div>
                          <div>
                              <label htmlFor="ioTypeCd" className={LABEL}>I/O Type</label>
                              <CodeSelect id="ioTypeCd" name="ioTypeCd" value={editForm.ioTypeCd} options={IO_TYPE_OPTIONS} onChange={onEditChange} className={FIELD} required={false} />
                          </div>
                          <div>
                              <label htmlFor="routeCd" className={LABEL}>Route</label>
                              <CodeSelect id="routeCd" name="routeCd" value={editForm.routeCd} options={IO_ROUTE_OPTIONS[editForm.ioTypeCd] ?? ALL_IO_ROUTE_OPTIONS} onChange={onEditChange} className={FIELD} required={false} />
                          </div>
                          <div>
                              <label htmlFor="amountMl" className={LABEL}>Amount (mL)</label>
                              <input type="number" id="amountMl" name="amountMl" value={editForm.amountMl} onChange={onEditChange} className={FIELD} />
                          </div>
                          <div>
                              <label htmlFor="recorderId" className={LABEL}>Recorder (Nurse)</label>
                              <NurseSelect id="recorderId" name="recorderId" value={editForm.recorderId} onChange={onEditChange} className={FIELD} required={false} />
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
export default IandORecordDetail;
