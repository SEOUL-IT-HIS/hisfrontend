"use client";

import { fetchAdmissionDetailRequest } from "@/features/inpatient/admissiondischarge/slice";
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
import { useDispatch, useSelector } from "react-redux";

const INFO_ROW = "flex justify-between border-b border-slate-100 px-4 py-3 text-sm last:border-b-0";
const LABEL = "mb-1 block text-sm font-medium text-slate-700";
const FIELD = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

const IandORecordDetail = () => {
    const dispatch = useDispatch();
    const { intakeOutputId }: { intakeOutputId: string } = useParams();
    const iandorecord = useSelector(selectIandORecordDetail);
    const updateStatus = useSelector(selectIandORecordUpdateStatus);
    const deleteStatus = useSelector(selectIandORecordDeleteStatus);
    const { loading, error } = useSelector(selectIandORecordDetailStatus);
    const admission = useSelector((state: RootState) => state.inpatient.admissiondischarge.detail);
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

    useEffect(() => {
        if (!iandorecord) return;
        setEditForm({
            recordedAt: new Date(iandorecord.recordedAt).toISOString().slice(0, 16),
            ioTypeCd: iandorecord.ioTypeCd,
            routeCd: iandorecord.routeCd,
            amountMl: String(iandorecord.amountMl),
            recorderId: String(iandorecord.recorderId),
        });
    }, [iandorecord]);

    const onEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleDelete = () => {
        if (!intakeOutputId) return;
        dispatch(deleteIandORecordRequest(intakeOutputId));
    };

    const handleUpdate = () => {
        if (!iandorecord) return;
        dispatch(updateIandORecordRequest({
            intakeOutputId: iandorecord.intakeOutputId,
            admissionId: iandorecord.admissionId,
            recordedAt: new Date(editForm.recordedAt),
            ioTypeCd: editForm.ioTypeCd,
            routeCd: editForm.routeCd,
            amountMl: Number(editForm.amountMl),
            recorderId: Number(editForm.recorderId),
        }));
    };

    const patientName = admission?.admissionId === iandorecord?.admissionId
        ? (patientDetail?.patientId === admission?.patientId ? patientDetail?.patientName : "Loading...")
        : "Loading...";

    return (
        <div className="mx-auto w-full max-w-2xl p-6">
            <div className="mb-6">
                <h1 className="text-lg font-semibold text-slate-800">Patient I&O Record Detail</h1>
                <p className="mt-1 text-sm text-slate-500">View and manage intake/output records.</p>
            </div>

            {loading && <p className="text-sm text-slate-500">Loading...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {!loading && iandorecord && (
                <div className="space-y-4">
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                            <span className="text-sm font-medium text-slate-800">{patientName}</span>
                        </div>
                        <div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Intake/Output ID</span>
                                <span className="text-slate-800">{iandorecord.intakeOutputId}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Admission ID</span>
                                <span className="text-slate-800">{iandorecord.admissionId}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Recorded At</span>
                                <span className="text-slate-800">{new Date(iandorecord.recordedAt).toLocaleString()}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">I/O Type Code</span>
                                <span className="text-slate-800">{iandorecord.ioTypeCd}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Route Code</span>
                                <span className="text-slate-800">{iandorecord.routeCd}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Amount (mL)</span>
                                <span className="text-slate-800">{iandorecord.amountMl}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Recorder ID</span>
                                <span className="text-slate-800">{iandorecord.recorderId}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Created At</span>
                                <span className="text-slate-800">{new Date(iandorecord.createdAt).toLocaleString()}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Updated At</span>
                                <span className="text-slate-800">{new Date(iandorecord.updatedAt).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-sm font-medium text-slate-800">Edit I&O Record</p>
                        <div>
                            <label htmlFor="recordedAt" className={LABEL}>Recorded At</label>
                            <input type="datetime-local" id="recordedAt" name="recordedAt" value={editForm.recordedAt} onChange={onEditChange} className={FIELD} />
                        </div>
                        <div>
                            <label htmlFor="ioTypeCd" className={LABEL}>I/O Type Code</label>
                            <input type="text" id="ioTypeCd" name="ioTypeCd" value={editForm.ioTypeCd} onChange={onEditChange} className={FIELD} />
                        </div>
                        <div>
                            <label htmlFor="routeCd" className={LABEL}>Route Code</label>
                            <input type="text" id="routeCd" name="routeCd" value={editForm.routeCd} onChange={onEditChange} className={FIELD} />
                        </div>
                        <div>
                            <label htmlFor="amountMl" className={LABEL}>Amount (mL)</label>
                            <input type="number" id="amountMl" name="amountMl" value={editForm.amountMl} onChange={onEditChange} className={FIELD} />
                        </div>
                        <div>
                            <label htmlFor="recorderId" className={LABEL}>Recorder ID</label>
                            <input type="number" id="recorderId" name="recorderId" value={editForm.recorderId} onChange={onEditChange} className={FIELD} />
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
export default IandORecordDetail;
