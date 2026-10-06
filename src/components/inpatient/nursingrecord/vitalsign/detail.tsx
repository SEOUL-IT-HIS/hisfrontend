"use client";

import { fetchAdmissionDetailRequest } from "@/features/inpatient/admissiondischarge/slice";
import { useNurseOptions } from "@/features/inpatient/admissiondischarge/useDoctorOptions";
import { fetchVitalSignDetailRequest, deleteVitalSignRequest, updateVitalSignRequest, fetchVitalSignHistoryRequest } from "@/features/inpatient/nursingrecord/vitalsign/slice";
import { fetchPatientDetailRequest } from "@/features/patient/slice/patientSlice";
import { RootState } from "@/store/store";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LABEL, FIELD } from "@/components/inpatient/common/styles";
import { Alert, Button, PageHeader } from "@/components/common";
import { InfoRow } from "@/components/inpatient/common/SectionCard";

const VitalSignDetail = () => {
    // 기록자 직원 ID(empId) → 간호사 이름 (목록에 없는 예전 숫자 ID 등은 그대로 표시)
    const { nameById: nurseNameById } = useNurseOptions();
    const dispatch = useDispatch();
    const { vitalSignId: vitalSignIdParam }: { vitalSignId: string } = useParams();
    const vitalSignId = vitalSignIdParam;
    const vitalSign = useSelector((state: RootState) => state.inpatient.vitalsign.detail);
    const updateStatus = useSelector((state: RootState) => state.inpatient.vitalsign.updateStatus);
    const deleteStatus = useSelector((state: RootState) => state.inpatient.vitalsign.deleteStatus);
    const { loading, error } = useSelector((state: RootState) => state.inpatient.vitalsign.detailStatus);
    const admission = useSelector((state: RootState) => state.inpatient.admissiondischarge.detail);
    // 퇴원 완료된 입원 건의 기록은 조회만 (서버에서도 등록·수정·삭제를 거절함)
    const readOnly = admission?.admissionId === vitalSign?.admissionId && admission?.status === "DISCHARGED";
    const patientDetail = useSelector((state: RootState) => state.patient.patientDetail);
    const history = useSelector((state: RootState) => state.inpatient.vitalsign.history);
    const historyStatus = useSelector((state: RootState) => state.inpatient.vitalsign.historyStatus);

    const [editForm, setEditForm] = useState({
        temperature: "",
        pulse: "",
        respiration: "",
        bpSystolic: "",
        bpDiastolic: "",
        spo2: "",
    });

    useEffect(() => {
        if (!vitalSignId) return;
        dispatch(fetchVitalSignHistoryRequest(vitalSignId));
    }, [vitalSignId]);

    useEffect(() => {
        if (!vitalSign?.admissionId) return;
        dispatch(fetchAdmissionDetailRequest(vitalSign.admissionId));
    }, [vitalSign?.admissionId]);

    useEffect(() => {
        if (!admission?.patientId) return;
        dispatch(fetchPatientDetailRequest(admission.patientId));
    }, [admission?.patientId]);

    useEffect(() => {
        if (!vitalSignId) return;
        dispatch(fetchVitalSignDetailRequest(vitalSignId));
    }, [vitalSignId]);

    useEffect(() => {
        if (updateStatus.success && vitalSignId) {
            dispatch(fetchVitalSignDetailRequest(vitalSignId));
        }
    }, [updateStatus.success, vitalSignId]);

    // 서버 값(vitalSign)이 바뀌면 수정 폼에 복사 — effect 대신 "이전 값 기억 → 렌더링 중 비교" 방식
    // (effect 안에서 setState하면 한 번 더 렌더링되므로 React 권장 방식으로 변경. 초기값 undefined라 첫 렌더링 때도 한 번 복사됨)
    const [prevVitalSign, setPrevVitalSign] = useState<typeof vitalSign | undefined>(undefined);
    if (vitalSign !== prevVitalSign) {
        setPrevVitalSign(vitalSign);
        if (vitalSign) {
            setEditForm({
                temperature: String(vitalSign.temperature),
                pulse: String(vitalSign.pulse),
                respiration: String(vitalSign.respiration),
                bpSystolic: String(vitalSign.bpSystolic),
                bpDiastolic: String(vitalSign.bpDiastolic),
                spo2: String(vitalSign.spo2),
            });
        }
    }

    const onEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleDelete = () => {
        if (!vitalSignId) return;
        dispatch(deleteVitalSignRequest(vitalSignId));
    };

    const handleUpdate = () => {
        if (!vitalSign) return;
        dispatch(updateVitalSignRequest({
            vitalSignId: vitalSign.vitalSignId,
            admissionId: vitalSign.admissionId,
            measuredAt: vitalSign.measuredAt,
            temperature: Number(editForm.temperature),
            pulse: Number(editForm.pulse),
            respiration: Number(editForm.respiration),
            bpSystolic: Number(editForm.bpSystolic),
            bpDiastolic: Number(editForm.bpDiastolic),
            spo2: Number(editForm.spo2),
            recorderId: vitalSign.recorderId,
        }));
    };

    const patientName = admission?.admissionId === vitalSign?.admissionId
        ? (patientDetail?.patientId === admission?.patientId ? patientDetail?.patientName : "Loading...")
        : "Loading...";

    return (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6">
            <PageHeader title="Vital Signs Detail" description="View and manage measurement records, edits, and change history." />

            {loading && <p className="text-sm text-slate-400">Loading...</p>}
            {error && <Alert>{error}</Alert>}

            {!loading && vitalSign && (
                <div className="space-y-4">
                    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3">
                            <span className="text-sm font-semibold text-slate-800">{patientName}</span>
                        </div>
                        <div>
                            <InfoRow label="Measured At">{new Date(vitalSign.measuredAt).toLocaleString()}</InfoRow>
                            <InfoRow label="Temperature">{vitalSign.temperature}</InfoRow>
                            <InfoRow label="Pulse">{vitalSign.pulse}</InfoRow>
                            <InfoRow label="Respiration Rate">{vitalSign.respiration}</InfoRow>
                            <InfoRow label="Blood Pressure">{vitalSign.bpSystolic}/{vitalSign.bpDiastolic}</InfoRow>
                            <InfoRow label="SpO2">{vitalSign.spo2}</InfoRow>
                            <InfoRow label="Recorded By">{vitalSign.recorderId ? nurseNameById.get(vitalSign.recorderId) ?? vitalSign.recorderId : "-"}</InfoRow>
                            <InfoRow label="Created At">{new Date(vitalSign.createdAt).toLocaleString()}</InfoRow>
                            <InfoRow label="Updated At">{new Date(vitalSign.updatedAt).toLocaleString()}</InfoRow>
                        </div>
                    </div>

                    {readOnly && (
                      <Alert variant="info">
                        This admission is discharged. Nursing records can be viewed but not edited or deleted.
                      </Alert>
                    )}
                    {!readOnly && (
                      <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                          <p className="text-sm font-semibold text-slate-800">Edit Vital Signs</p>
                          <div>
                              <label htmlFor="temperature" className={LABEL}>Temperature</label>
                              <input type="number" id="temperature" name="temperature" value={editForm.temperature} onChange={onEditChange} step="0.1" className={FIELD} />
                          </div>
                          <div>
                              <label htmlFor="pulse" className={LABEL}>Pulse</label>
                              <input type="number" id="pulse" name="pulse" value={editForm.pulse} onChange={onEditChange} min="60" max="100" className={FIELD} />
                          </div>
                          <div>
                              <label htmlFor="respiration" className={LABEL}>Respiration Rate</label>
                              <input type="number" id="respiration" name="respiration" value={editForm.respiration} onChange={onEditChange} min="12" max="20" className={FIELD} />
                          </div>
                          <div>
                              <label htmlFor="bpSystolic" className={LABEL}>Systolic Blood Pressure</label>
                              <input type="number" id="bpSystolic" name="bpSystolic" value={editForm.bpSystolic} onChange={onEditChange} min="0" className={FIELD} />
                          </div>
                          <div>
                              <label htmlFor="bpDiastolic" className={LABEL}>Diastolic Blood Pressure</label>
                              <input type="number" id="bpDiastolic" name="bpDiastolic" value={editForm.bpDiastolic} onChange={onEditChange} min="0" className={FIELD} />
                          </div>
                          <div>
                              <label htmlFor="spo2" className={LABEL}>SpO2</label>
                              <input type="number" id="spo2" name="spo2" value={editForm.spo2} onChange={onEditChange} step="0.1" min="0" max="100" className={FIELD} />
                          </div>
                          <Button
                              onClick={handleUpdate}
                              disabled={updateStatus.loading}
                          >
                              {updateStatus.loading ? "Updating..." : "Update"}
                          </Button>
                          {updateStatus.error && <Alert>{updateStatus.error}</Alert>}
                          {updateStatus.success && <Alert variant="success">Update completed</Alert>}
                      </div>
                    )}

                    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <p className="mb-3 text-sm font-semibold text-slate-800">Change History</p>
                        {historyStatus.loading && <p className="text-sm text-slate-400">Loading history...</p>}
                        {historyStatus.error && <Alert>{historyStatus.error}</Alert>}
                        {history.length === 0 && !historyStatus.loading && (
                            <p className="text-sm text-slate-400">No change history</p>
                        )}
                        {history.length > 0 && (
                            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/95 text-xs font-medium uppercase tracking-wide text-slate-400">
                                            <th className="whitespace-nowrap px-3 py-2">Type</th>
                                            <th className="whitespace-nowrap px-3 py-2">Changed At</th>
                                            <th className="whitespace-nowrap px-3 py-2">Temperature</th>
                                            <th className="whitespace-nowrap px-3 py-2">Pulse</th>
                                            <th className="whitespace-nowrap px-3 py-2">Respiration Rate</th>
                                            <th className="whitespace-nowrap px-3 py-2">Blood Pressure</th>
                                            <th className="whitespace-nowrap px-3 py-2">SpO2</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {history.map((h) => (
                                            <tr key={h.vitalSignHistoryId}>
                                                <td className="whitespace-nowrap px-3 py-2">
                                                    <span
                                                        className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
                                                            h.changeType === "UPDATED"
                                                                ? "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200"
                                                                : "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200"
                                                        }`}
                                                    >
                                                        {h.changeType === "UPDATED" ? "Updated" : "Deleted"}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-2 text-slate-600">{new Date(h.changedAt).toLocaleString()}</td>
                                                <td className="whitespace-nowrap px-3 py-2 text-slate-600">{h.temperature}</td>
                                                <td className="whitespace-nowrap px-3 py-2 text-slate-600">{h.pulse}</td>
                                                <td className="whitespace-nowrap px-3 py-2 text-slate-600">{h.respiration}</td>
                                                <td className="whitespace-nowrap px-3 py-2 text-slate-600">{h.bpSystolic}/{h.bpDiastolic}</td>
                                                <td className="whitespace-nowrap px-3 py-2 text-slate-600">{h.spo2}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

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
export default VitalSignDetail;
