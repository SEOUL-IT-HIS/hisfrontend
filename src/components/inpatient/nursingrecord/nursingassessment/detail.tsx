"use client";

import { fetchAdmissionDetailRequest } from "@/features/inpatient/admissiondischarge/slice";
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
import { useDispatch, useSelector } from "react-redux";

const INFO_ROW = "flex justify-between border-b border-slate-100 px-4 py-3 text-sm last:border-b-0";
const LABEL = "mb-1 block text-sm font-medium text-slate-700";
const FIELD = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

const NursingAssessmentDetail = () => {
    const dispatch = useDispatch();
    const { nursingAssessmentId }: { nursingAssessmentId: string } = useParams();
    const nursingAssessment = useSelector(selectNursingAssessmentDetail);
    const updateStatus = useSelector(selectNursingAssessmentUpdateStatus);
    const deleteStatus = useSelector(selectNursingAssessmentDeleteStatus);
    const { loading, error } = useSelector(selectNursingAssessmentDetailStatus);
    const admission = useSelector((state: RootState) => state.inpatient.admissiondischarge.detail);
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

    useEffect(() => {
        if (!nursingAssessment) return;
        setEditForm({
            allergyYn: nursingAssessment.allergyYn,
            allergyDetail: nursingAssessment.allergyDetail,
            pastMedicalHistory: nursingAssessment.pastMedicalHistory,
            mentalStatusCd: nursingAssessment.mentalStatusCd,
            assessedAt: new Date(nursingAssessment.assessedAt).toISOString().slice(0, 16),
            assessorId: String(nursingAssessment.assessorId),
        });
    }, [nursingAssessment]);

    const onEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleDelete = () => {
        if (!nursingAssessmentId) return;
        dispatch(deleteNursingAssessmentRequest(nursingAssessmentId));
    };

    const handleUpdate = () => {
        if (!nursingAssessment) return;
        dispatch(updateNursingAssessmentRequest({
            nursingAssessmentId: nursingAssessment.nursingAssessmentId,
            admissionId: nursingAssessment.admissionId,
            allergyYn: editForm.allergyYn,
            allergyDetail: editForm.allergyDetail,
            pastMedicalHistory: editForm.pastMedicalHistory,
            mentalStatusCd: editForm.mentalStatusCd,
            assessedAt: new Date(editForm.assessedAt),
            assessorId: Number(editForm.assessorId),
        }));
    };

    const patientName = admission?.admissionId === nursingAssessment?.admissionId
        ? (patientDetail?.patientId === admission?.patientId ? patientDetail?.patientName : "Loading...")
        : "Loading...";

    return (
        <div className="mx-auto w-full max-w-2xl p-6">
            <div className="mb-6">
                <h1 className="text-lg font-semibold text-slate-800">Patient Nursing Assessment Detail</h1>
                <p className="mt-1 text-sm text-slate-500">View and manage nursing assessment records.</p>
            </div>

            {loading && <p className="text-sm text-slate-500">Loading...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {!loading && nursingAssessment && (
                <div className="space-y-4">
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                            <span className="text-sm font-medium text-slate-800">{patientName}</span>
                        </div>
                        <div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Nursing Assessment ID</span>
                                <span className="text-slate-800">{nursingAssessment.nursingAssessmentId}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Admission ID</span>
                                <span className="text-slate-800">{nursingAssessment.admissionId}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Allergy Yn</span>
                                <span className="text-slate-800">{nursingAssessment.allergyYn}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Allergy Detail</span>
                                <span className="text-slate-800">{nursingAssessment.allergyDetail}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Past Medical History</span>
                                <span className="text-slate-800">{nursingAssessment.pastMedicalHistory}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Mental Status Code</span>
                                <span className="text-slate-800">{nursingAssessment.mentalStatusCd}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Assessed At</span>
                                <span className="text-slate-800">{new Date(nursingAssessment.assessedAt).toLocaleString()}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Assessor ID</span>
                                <span className="text-slate-800">{nursingAssessment.assessorId}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Created At</span>
                                <span className="text-slate-800">{new Date(nursingAssessment.createdAt).toLocaleString()}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Updated At</span>
                                <span className="text-slate-800">{new Date(nursingAssessment.updatedAt).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-sm font-medium text-slate-800">Edit Nursing Assessment</p>
                        <div>
                            <label htmlFor="allergyYn" className={LABEL}>Allergy Yn</label>
                            <input type="text" id="allergyYn" name="allergyYn" value={editForm.allergyYn} onChange={onEditChange} className={FIELD} />
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
                            <label htmlFor="mentalStatusCd" className={LABEL}>Mental Status Code</label>
                            <input type="text" id="mentalStatusCd" name="mentalStatusCd" value={editForm.mentalStatusCd} onChange={onEditChange} className={FIELD} />
                        </div>
                        <div>
                            <label htmlFor="assessedAt" className={LABEL}>Assessed At</label>
                            <input type="datetime-local" id="assessedAt" name="assessedAt" value={editForm.assessedAt} onChange={onEditChange} className={FIELD} />
                        </div>
                        <div>
                            <label htmlFor="assessorId" className={LABEL}>Assessor ID</label>
                            <input type="number" id="assessorId" name="assessorId" value={editForm.assessorId} onChange={onEditChange} className={FIELD} />
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
export default NursingAssessmentDetail;
