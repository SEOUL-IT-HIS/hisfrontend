"use client";

import { fetchAdmissionDetailRequest } from "@/features/inpatient/admissiondischarge/slice";
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
import { useDispatch, useSelector } from "react-redux";

const INFO_ROW = "flex justify-between border-b border-slate-100 px-4 py-3 text-sm last:border-b-0";
const LABEL = "mb-1 block text-sm font-medium text-slate-700";
const FIELD = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

const RestraintDetail = () => {
    const dispatch = useDispatch();
    const { restraintId }: { restraintId: string } = useParams();
    const restraint = useSelector(selectRestraintDetail);
    const updateStatus = useSelector(selectRestraintUpdateStatus);
    const deleteStatus = useSelector(selectRestraintDeleteStatus);
    const { loading, error } = useSelector(selectRestraintDetailStatus);
    const admission = useSelector((state: RootState) => state.inpatient.admissiondischarge.detail);
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

    useEffect(() => {
        if (!restraint) return;
        setEditForm({
            restraintTypeCd: restraint.restraintTypeCd,
            appliedAt: new Date(restraint.appliedAt).toISOString().slice(0, 16),
            reason: restraint.reason,
            doctorOrderId: restraint.doctorOrderId,
            evaluatorId: restraint.evaluatorId,
        });
    }, [restraint]);

    const onEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleDelete = () => {
        if (!restraintId) return;
        dispatch(deleteRestraintRequest(restraintId));
    };

    const handleUpdate = () => {
        if (!restraint) return;
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
        <div className="mx-auto w-full max-w-2xl p-6">
            <div className="mb-6">
                <h1 className="text-lg font-semibold text-slate-800">Patient Restraint Detail</h1>
                <p className="mt-1 text-sm text-slate-500">View and manage restraint records.</p>
            </div>

            {loading && <p className="text-sm text-slate-500">Loading...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {!loading && restraint && (
                <div className="space-y-4">
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                            <span className="text-sm font-medium text-slate-800">{patientName}</span>
                        </div>
                        <div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Restraint ID</span>
                                <span className="text-slate-800">{restraint.restraintId}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Admission ID</span>
                                <span className="text-slate-800">{restraint.admissionId}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Restraint Type Code</span>
                                <span className="text-slate-800">{restraint.restraintTypeCd}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Applied At</span>
                                <span className="text-slate-800">{new Date(restraint.appliedAt).toLocaleString()}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Reason</span>
                                <span className="text-slate-800">{restraint.reason}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Doctor Order ID</span>
                                <span className="text-slate-800">{restraint.doctorOrderId}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Evaluator ID</span>
                                <span className="text-slate-800">{restraint.evaluatorId}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Created At</span>
                                <span className="text-slate-800">{new Date(restraint.createdAt).toLocaleString()}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Updated At</span>
                                <span className="text-slate-800">{new Date(restraint.updatedAt).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-sm font-medium text-slate-800">Edit Restraint</p>
                        <div>
                            <label htmlFor="restraintTypeCd" className={LABEL}>Restraint Type Code</label>
                            <input type="text" id="restraintTypeCd" name="restraintTypeCd" value={editForm.restraintTypeCd} onChange={onEditChange} className={FIELD} />
                        </div>
                        <div>
                            <label htmlFor="appliedAt" className={LABEL}>Applied At</label>
                            <input type="datetime-local" id="appliedAt" name="appliedAt" value={editForm.appliedAt} onChange={onEditChange} className={FIELD} />
                        </div>
                        <div>
                            <label htmlFor="reason" className={LABEL}>Reason</label>
                            <input type="text" id="reason" name="reason" value={editForm.reason} onChange={onEditChange} className={FIELD} />
                        </div>
                        <div>
                            <label htmlFor="doctorOrderId" className={LABEL}>Doctor Order ID</label>
                            <input type="text" id="doctorOrderId" name="doctorOrderId" value={editForm.doctorOrderId} onChange={onEditChange} className={FIELD} />
                        </div>
                        <div>
                            <label htmlFor="evaluatorId" className={LABEL}>Evaluator ID</label>
                            <input type="text" id="evaluatorId" name="evaluatorId" value={editForm.evaluatorId} onChange={onEditChange} className={FIELD} />
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
export default RestraintDetail;
