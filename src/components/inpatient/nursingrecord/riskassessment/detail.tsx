"use client";

import { fetchAdmissionDetailRequest } from "@/features/inpatient/admissiondischarge/slice";
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
import { useDispatch, useSelector } from "react-redux";

const RISK_BADGE: Record<string, string> = {
    HIGH: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
    MEDIUM: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
    LOW: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
};

const RISK_LABEL: Record<string, string> = {
    HIGH: "고위험",
    MEDIUM: "중위험",
    LOW: "저위험",
};

const INFO_ROW = "flex justify-between border-b border-slate-100 px-4 py-3 text-sm last:border-b-0";
const LABEL = "mb-1 block text-sm font-medium text-slate-700";
const FIELD = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

const RiskAssessmentDetail = () => {
    const dispatch = useDispatch();
    const { patientRiskAssessmentId: idParam }: { patientRiskAssessmentId: string } = useParams();
    const patientRiskAssessmentId = idParam;
    const riskAssessment = useSelector(selectRiskAssessmentDetail);
    const updateStatus = useSelector(selectRiskAssessmentUpdateStatus);
    const deleteStatus = useSelector(selectRiskAssessmentDeleteStatus);
    const { loading, error } = useSelector(selectRiskAssessmentDetailStatus);
    const admission = useSelector((state: RootState) => state.inpatient.admissiondischarge.detail);
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

    useEffect(() => {
        if (!riskAssessment) return;
        setEditForm({
            assessmentTypeCd: riskAssessment.assessmentTypeCd,
            score: String(riskAssessment.score),
            riskLevelCd: riskAssessment.riskLevelCd,
            assessedAt: new Date(riskAssessment.assessedAt).toISOString().slice(0, 16),
            assessorId: String(riskAssessment.assessorId),
        });
    }, [riskAssessment]);

    const onEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleDelete = () => {
        if (!patientRiskAssessmentId) return;
        dispatch(deleteRiskAssessmentRequest(patientRiskAssessmentId));
    };

    const handleUpdate = () => {
        if (!riskAssessment) return;
        dispatch(updateRiskAssessmentRequest({
            patientRiskAssessmentId: riskAssessment.patientRiskAssessmentId,
            admissionId: riskAssessment.admissionId,
            assessmentTypeCd: editForm.assessmentTypeCd,
            score: Number(editForm.score),
            riskLevelCd: editForm.riskLevelCd,
            assessedAt: new Date(editForm.assessedAt),
            assessorId: Number(editForm.assessorId),
        }));
    };

    const patientName = admission?.admissionId === riskAssessment?.admissionId
        ? (patientDetail?.patientId === admission?.patientId ? patientDetail?.patientName : "조회중...")
        : "조회중...";

    return (
        <div className="mx-auto w-full max-w-2xl p-6">
            <div className="mb-6">
                <h1 className="text-lg font-semibold text-slate-800">환자위험도평가 상세</h1>
                <p className="mt-1 text-sm text-slate-500">평가 결과 조회 및 수정을 관리합니다.</p>
            </div>

            {loading && <p className="text-sm text-slate-500">로딩중...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {!loading && riskAssessment && (
                <div className="space-y-4">
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                            <span className="text-sm font-medium text-slate-800">{patientName}</span>
                            <span
                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                                    RISK_BADGE[riskAssessment.riskLevelCd] ?? "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
                                }`}
                            >
                                {RISK_LABEL[riskAssessment.riskLevelCd] ?? riskAssessment.riskLevelCd}
                            </span>
                        </div>
                        <div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">위험도평가ID</span>
                                <span className="text-slate-800">{riskAssessment.patientRiskAssessmentId}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">입원ID</span>
                                <span className="text-slate-800">{riskAssessment.admissionId}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">평가유형코드</span>
                                <span className="text-slate-800">{riskAssessment.assessmentTypeCd}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">평가점수</span>
                                <span className="text-slate-800">{riskAssessment.score}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">평가일시</span>
                                <span className="text-slate-800">{new Date(riskAssessment.assessedAt).toLocaleString()}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">평가자ID</span>
                                <span className="text-slate-800">{riskAssessment.assessorId}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">생성일시</span>
                                <span className="text-slate-800">{new Date(riskAssessment.createdAt).toLocaleString()}</span>
                            </div>
                            <div className={INFO_ROW}>
                                <span className="text-slate-500">수정일시</span>
                                <span className="text-slate-800">{new Date(riskAssessment.updatedAt).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-sm font-medium text-slate-800">위험도평가 수정</p>
                        <div>
                            <label htmlFor="assessmentTypeCd" className={LABEL}>평가유형코드</label>
                            <input type="text" id="assessmentTypeCd" name="assessmentTypeCd" value={editForm.assessmentTypeCd} onChange={onEditChange} className={FIELD} />
                        </div>
                        <div>
                            <label htmlFor="score" className={LABEL}>평가점수</label>
                            <input type="number" id="score" name="score" value={editForm.score} onChange={onEditChange} className={FIELD} />
                        </div>
                        <div>
                            <label htmlFor="riskLevelCd" className={LABEL}>위험도등급코드</label>
                            <input type="text" id="riskLevelCd" name="riskLevelCd" value={editForm.riskLevelCd} onChange={onEditChange} className={FIELD} />
                        </div>
                        <div>
                            <label htmlFor="assessedAt" className={LABEL}>평가일시</label>
                            <input type="datetime-local" id="assessedAt" name="assessedAt" value={editForm.assessedAt} onChange={onEditChange} className={FIELD} />
                        </div>
                        <div>
                            <label htmlFor="assessorId" className={LABEL}>평가자ID</label>
                            <input type="number" id="assessorId" name="assessorId" value={editForm.assessorId} onChange={onEditChange} className={FIELD} />
                        </div>
                        <button
                            onClick={handleUpdate}
                            disabled={updateStatus.loading}
                            className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
                        >
                            {updateStatus.loading ? "수정중..." : "수정"}
                        </button>
                        {updateStatus.error && <p className="text-sm text-red-600">{updateStatus.error}</p>}
                        {updateStatus.success && <p className="text-sm text-emerald-600">수정 완료</p>}
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <button
                            onClick={handleDelete}
                            disabled={deleteStatus.loading}
                            className="inline-flex items-center rounded-lg border border-rose-300 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                        >
                            {deleteStatus.loading ? "삭제중..." : "삭제"}
                        </button>
                        {deleteStatus.error && <p className="mt-2 text-sm text-red-600">{deleteStatus.error}</p>}
                    </div>
                </div>
            )}
        </div>
    );
}
export default RiskAssessmentDetail;
