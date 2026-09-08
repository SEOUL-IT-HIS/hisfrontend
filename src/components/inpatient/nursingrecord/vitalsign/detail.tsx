"use client";

import { fetchAdmissionDetailRequest } from "@/features/inpatient/admissiondischarge/slice";
import { fetchVitalSignDetailRequest, deleteVitalSignRequest, updateVitalSignRequest, fetchVitalSignHistoryRequest } from "@/features/inpatient/nursingrecord/vitalsign/slice";
import { fetchPatientDetailRequest } from "@/features/patient/slice/patientSlice";
import { RootState } from "@/store/store";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const INFO_ROW = "flex justify-between border-b border-slate-100 px-4 py-3 text-sm last:border-b-0";
const LABEL = "mb-1 block text-sm font-medium text-slate-700";
const FIELD = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

const VitalSignDetail = () => {
    const dispatch = useDispatch();
    const { vitalSignId: vitalSignIdParam }: { vitalSignId: string } = useParams();
    const vitalSignId = vitalSignIdParam;
    const vitalSign = useSelector((state: RootState) => state.inpatient.vitalsign.detail);
    const updateStatus = useSelector((state: RootState) => state.inpatient.vitalsign.updateStatus);
    const deleteStatus = useSelector((state: RootState) => state.inpatient.vitalsign.deleteStatus);
    const { loading, error } = useSelector((state: RootState) => state.inpatient.vitalsign.detailStatus);
    const admission = useSelector((state: RootState) => state.inpatient.admissiondischarge.detail);
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

    useEffect(() => {
        if (!vitalSign) return;
        setEditForm({
            temperature: String(vitalSign.temperature),
            pulse: String(vitalSign.pulse),
            respiration: String(vitalSign.respiration),
            bpSystolic: String(vitalSign.bpSystolic),
            bpDiastolic: String(vitalSign.bpDiastolic),
            spo2: String(vitalSign.spo2),
        });
    }, [vitalSign]);

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
        <div className="mx-auto w-full max-w-2xl p-6">
            <div className="mb-6">
                <h1 className="text-lg font-semibold text-slate-800">Vital Signs Detail</h1>
                <p className="mt-1 text-sm text-slate-500">View and manage measurement records, edits, and change history.</p>
            </div>

            {loading && <p className="text-sm text-slate-500">Loading...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {!loading && vitalSign && (
                <div className="space-y-4">
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 px-4 py-3">
                            <span className="text-sm font-medium text-slate-800">{patientName}</span>
                        </div>
                        <div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Vital Signs ID</span>
                                <span className="text-slate-800">{vitalSign.vitalSignId}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Admission ID</span>
                                <span className="text-slate-800">{vitalSign.admissionId}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Measured At</span>
                                <span className="text-slate-800">{new Date(vitalSign.measuredAt).toLocaleString()}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Temperature</span>
                                <span className="text-slate-800">{vitalSign.temperature}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Pulse</span>
                                <span className="text-slate-800">{vitalSign.pulse}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Respiration Rate</span>
                                <span className="text-slate-800">{vitalSign.respiration}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Blood Pressure</span>
                                <span className="text-slate-800">{vitalSign.bpSystolic}/{vitalSign.bpDiastolic}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">SpO2</span>
                                <span className="text-slate-800">{vitalSign.spo2}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Recorded By</span>
                                <span className="text-slate-800">{vitalSign.recorderId}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Created At</span>
                                <span className="text-slate-800">{new Date(vitalSign.createdAt).toLocaleString()}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Updated At</span>
                                <span className="text-slate-800">{new Date(vitalSign.updatedAt).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-sm font-medium text-slate-800">Edit Vital Signs</p>
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
                        <button
                            onClick={handleUpdate}
                            disabled={updateStatus.loading}
                            className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
                        >
                            {updateStatus.loading ? "Updating..." : "Update"}
                        </button>
                        {updateStatus.error && <p className="text-sm text-red-600">{updateStatus.error}</p>}
                        {updateStatus.success && <p className="text-sm text-emerald-600">Update completed</p>}
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="mb-3 text-sm font-medium text-slate-800">Change History</p>
                        {historyStatus.loading && <p className="text-sm text-slate-500">Loading history...</p>}
                        {historyStatus.error && <p className="text-sm text-red-600">{historyStatus.error}</p>}
                        {history.length === 0 && !historyStatus.loading && (
                            <p className="text-sm text-slate-500">No change history</p>
                        )}
                        {history.length > 0 && (
                            <div className="overflow-x-auto rounded-lg border border-slate-200">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
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

                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <button
                            onClick={handleDelete}
                            disabled={deleteStatus.loading}
                            className="inline-flex items-center rounded-lg border border-rose-300 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                        >
                            {deleteStatus.loading ? "Deleting..." : "Delete"}
                        </button>
                        {deleteStatus.error && <p className="mt-2 text-sm text-red-600">{deleteStatus.error}</p>}
                    </div>
                </div>
            )}
        </div>
    );
}
export default VitalSignDetail;
