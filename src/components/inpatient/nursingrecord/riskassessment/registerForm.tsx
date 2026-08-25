"use client";

import { AppDispatch } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createRiskAssessmentRequest, selectRiskAssessmentCreateStatus } from "@/features/inpatient/nursingrecord/riskassessment/slice";

const RiskAssessmentRegisterForm = () => {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error, success } = useSelector(selectRiskAssessmentCreateStatus);

    const [form, setForm] = useState({
        admissionId: "",
        assessmentTypeCd: "",
        score: "",
        riskLevelCd: "",
        assessedAt: "",
        assessorId: "",
    });

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prevForm) => ({ ...prevForm, [name]: value }));
    };

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        dispatch(createRiskAssessmentRequest({
            admissionId: form.admissionId,
            assessmentTypeCd: form.assessmentTypeCd,
            score: Number(form.score),
            riskLevelCd: form.riskLevelCd,
            assessedAt: new Date(form.assessedAt),
            assessorId: Number(form.assessorId),
        }));
    };

    useEffect(() => {
        if (success) {
            router.push("/inpatient/nursingrecord/riskassessment/list");
        }
    }, [success, router]);

    return (
        <div>
            <h2>위험도평가 등록</h2>
            {loading && <p>로딩중...</p>}
            {error && <p>{error}</p>}
            <form onSubmit={onSubmit}>
                <div>
                    <label htmlFor="admissionId">입원ID:</label>
                    <input type="text" id="admissionId" name="admissionId" value={form.admissionId} onChange={onChange} required />
                </div>
                <div>
                    <label htmlFor="assessmentTypeCd">평가유형코드:</label>
                    <input type="text" id="assessmentTypeCd" name="assessmentTypeCd" value={form.assessmentTypeCd} onChange={onChange} required />
                </div>
                <div>
                    <label htmlFor="score">평가점수:</label>
                    <input type="number" id="score" name="score" value={form.score} onChange={onChange} required />
                </div>
                <div>
                    <label htmlFor="riskLevelCd">위험도등급코드:</label>
                    <input type="text" id="riskLevelCd" name="riskLevelCd" value={form.riskLevelCd} onChange={onChange} required />
                </div>
                <div>
                    <label htmlFor="assessedAt">평가일시:</label>
                    <input type="datetime-local" id="assessedAt" name="assessedAt" value={form.assessedAt} onChange={onChange} required />
                </div>
                <div>
                    <label htmlFor="assessorId">평가자ID:</label>
                    <input type="number" id="assessorId" name="assessorId" value={form.assessorId} onChange={onChange} required />
                </div>
                <button type="submit" disabled={loading}>등록</button>
            </form>
        </div>
    );
}
export default RiskAssessmentRegisterForm;
