"use client"

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

    return (
        <div>
            {loading && <p>로딩중...</p>}
            {error && <p>{error}</p>}
            {!loading && riskAssessment &&
                <div>
                    <p>환자명: {
                        admission?.admissionId === riskAssessment.admissionId
                            ? (patientDetail?.patientId === admission.patientId ? patientDetail.patientName : "조회중...")
                            : "조회중..."
                    }</p>

                    <p>PatientRiskAssessmentId: {riskAssessment.patientRiskAssessmentId}</p>
                    <p>AdmissionId: {riskAssessment.admissionId}</p>
                    <p>AssessmentTypeCd: {riskAssessment.assessmentTypeCd}</p>
                    <p>Score: {riskAssessment.score}</p>
                    <p>RiskLevelCd: {riskAssessment.riskLevelCd}</p>
                    <p>AssessedAt: {new Date(riskAssessment.assessedAt).toLocaleString()}</p>
                    <p>AssessorId: {riskAssessment.assessorId}</p>
                    <p>CreatedAt: {new Date(riskAssessment.createdAt).toLocaleString()}</p>
                    <p>UpdatedAt: {new Date(riskAssessment.updatedAt).toLocaleString()}</p>

                    <button onClick={handleDelete} disabled={deleteStatus.loading}>
                        {deleteStatus.loading ? "삭제중..." : "삭제"}
                    </button>
                    {deleteStatus.error && <p>{deleteStatus.error}</p>}

                    <h3>위험도평가 수정</h3>
                    <div>
                        <label htmlFor="assessmentTypeCd">평가유형코드:</label>
                        <input type="text" id="assessmentTypeCd" name="assessmentTypeCd" value={editForm.assessmentTypeCd} onChange={onEditChange} />
                    </div>
                    <div>
                        <label htmlFor="score">평가점수:</label>
                        <input type="number" id="score" name="score" value={editForm.score} onChange={onEditChange} />
                    </div>
                    <div>
                        <label htmlFor="riskLevelCd">위험도등급코드:</label>
                        <input type="text" id="riskLevelCd" name="riskLevelCd" value={editForm.riskLevelCd} onChange={onEditChange} />
                    </div>
                    <div>
                        <label htmlFor="assessedAt">평가일시:</label>
                        <input type="datetime-local" id="assessedAt" name="assessedAt" value={editForm.assessedAt} onChange={onEditChange} />
                    </div>
                    <div>
                        <label htmlFor="assessorId">평가자ID:</label>
                        <input type="number" id="assessorId" name="assessorId" value={editForm.assessorId} onChange={onEditChange} />
                    </div>
                    <button onClick={handleUpdate} disabled={updateStatus.loading}>
                        {updateStatus.loading ? "수정중..." : "수정"}
                    </button>
                    {updateStatus.error && <p>{updateStatus.error}</p>}
                    {updateStatus.success && <p>수정 완료</p>}
                </div>
            }
        </div>
    );
}
export default RiskAssessmentDetail;
