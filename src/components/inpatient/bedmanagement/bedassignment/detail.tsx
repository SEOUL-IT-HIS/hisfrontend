"use client";

import { fetchAdmissionDetailRequest } from "@/features/inpatient/admissiondischarge/slice";
import { fetchBedAssignmentDetailRequest, updateBedAssignmentRequest, selectBedAssignmentUpdateStatus } from "@/features/inpatient/bedmanagement/bedassignment/slice";
import { fetchPatientDetailRequest } from "@/features/patient/slice/patientSlice";
import { RootState } from "@/store/store";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

const INFO_ROW = "flex justify-between border-b border-slate-100 px-4 py-3 text-sm last:border-b-0";

type BedAssignmentDetailProps = {
    /** 목록 옆에 끼워 넣을 때 라우트 파라미터 대신 직접 전달 */
    assignmentId?: number;
    /** 목록 옆에 끼워 넣었을 때만 표시되는 "선택 해제" 버튼 */
    onClose?: () => void;
};

const BedAssignmentDetail = ({ assignmentId: assignmentIdProp, onClose }: BedAssignmentDetailProps = {}) => {
    const dispatch = useDispatch();
    const routeParams = useParams() as { assignmentId?: string };
    const assignmentId = assignmentIdProp ?? Number(routeParams.assignmentId);
    const bedAssignment = useSelector((state: RootState) => state.inpatient.bedmanagement.detail);
    const updateStatus = useSelector((state: RootState) => state.inpatient.bedmanagement.updateStatus);
    const { loading, error } = useSelector((state: RootState) => state.inpatient.bedmanagement.detailStatus);
    const admission = useSelector((state: RootState) => state.inpatient.admissiondischarge.detail);
    const patientDetail = useSelector((state: RootState) => state.patient.patientDetail);

    useEffect(() => {
        if (!bedAssignment?.admissionId) return;
        dispatch(fetchAdmissionDetailRequest(bedAssignment.admissionId));
    }, [bedAssignment?.admissionId]);

    useEffect(() => {
        if (!admission?.patientId) return;
        dispatch(fetchPatientDetailRequest(admission.patientId));
    }, [admission?.patientId]);

    useEffect(() => {
        if (!assignmentId) return;
        dispatch(fetchBedAssignmentDetailRequest(assignmentId));
    }, [assignmentId]);

    useEffect(() => {
        if (updateStatus.success && assignmentId) {
            dispatch(fetchBedAssignmentDetailRequest(assignmentId));
        }
    }, [updateStatus.success, assignmentId]);

    const handleRelease = () => {
        if (!bedAssignment) return;
        dispatch(updateBedAssignmentRequest({ ...bedAssignment,
            releasedAt: new Date().toISOString().slice(0, -1) }));
    };

    const patientName =
        admission?.admissionId === bedAssignment?.admissionId
            ? (patientDetail?.patientId === admission?.patientId ? patientDetail?.patientName : "Patient Not Found")
            : "Admission Not Found";

    const isActive = bedAssignment?.releasedAt === null;

    return (
        <div className="w-full p-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-slate-800">Bed Assignment Details</h1>
                    <p className="mt-1 text-sm text-slate-500">Assignment details and release status.</p>
                </div>
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                    >
                        Deselect
                    </button>
                )}
            </div>

            {loading && <p className="text-sm text-slate-500">Loading...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {!loading && bedAssignment && (
                <div className="space-y-4">
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                            <span className="text-sm font-medium text-slate-800">{patientName}</span>
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
                        <div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Assignment ID</span>
                                <span className="text-slate-800">{bedAssignment.assignmentId}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Bed ID</span>
                                <span className="text-slate-800">{bedAssignment.bedId}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Admission ID</span>
                                <span className="text-slate-800">{bedAssignment.admissionId}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Assigned At</span>
                                <span className="text-slate-800">{bedAssignment.assignedAt}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Released At</span>
                                <span className="text-slate-800">{bedAssignment.releasedAt ?? "-"}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Created At</span>
                                <span className="text-slate-800">{bedAssignment.createdAt}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">Updated At</span>
                                <span className="text-slate-800">{bedAssignment.updatedAt}</span>
                            </div>
                        </div>
                    </div>

                    {isActive && (
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <button
                                onClick={handleRelease}
                                disabled={updateStatus.loading}
                                className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
                            >
                                {updateStatus.loading ? "Processing..." : "Release Bed"}
                            </button>
                            {updateStatus.error && <p className="mt-2 text-sm text-red-600">{updateStatus.error}</p>}
                            {updateStatus.success && <p className="mt-2 text-sm text-emerald-600">Bed released successfully</p>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
export default BedAssignmentDetail;
