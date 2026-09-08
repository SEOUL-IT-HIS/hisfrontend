"use client";

import { AppDispatch } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createRiskAssessmentRequest, selectRiskAssessmentCreateStatus } from "@/features/inpatient/nursingrecord/riskassessment/slice";

const LABEL = "mb-1 block text-sm font-medium text-slate-700";
const FIELD = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

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
        <div className="mx-auto w-full max-w-lg p-6">
            <div className="mb-6">
                <h1 className="text-lg font-semibold text-slate-800">Register Patient Risk Assessment</h1>
                <p className="mt-1 text-sm text-slate-500">Register a patient's risk assessment results.</p>
            </div>

            {loading && <p className="mb-3 text-sm text-slate-500">Loading...</p>}
            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

            <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                    <label htmlFor="admissionId" className={LABEL}>Admission ID</label>
                    <input type="text" id="admissionId" name="admissionId" value={form.admissionId} onChange={onChange} required className={FIELD} />
                </div>
                <div>
                    <label htmlFor="assessmentTypeCd" className={LABEL}>Assessment Type Code</label>
                    <input type="text" id="assessmentTypeCd" name="assessmentTypeCd" value={form.assessmentTypeCd} onChange={onChange} required className={FIELD} />
                </div>
                <div>
                    <label htmlFor="score" className={LABEL}>Assessment Score</label>
                    <input type="number" id="score" name="score" value={form.score} onChange={onChange} required className={FIELD} />
                </div>
                <div>
                    <label htmlFor="riskLevelCd" className={LABEL}>Risk Level Code</label>
                    <input type="text" id="riskLevelCd" name="riskLevelCd" value={form.riskLevelCd} onChange={onChange} required className={FIELD} />
                </div>
                <div>
                    <label htmlFor="assessedAt" className={LABEL}>Assessment Date/Time</label>
                    <input type="datetime-local" id="assessedAt" name="assessedAt" value={form.assessedAt} onChange={onChange} required className={FIELD} />
                </div>
                <div>
                    <label htmlFor="assessorId" className={LABEL}>Assessor ID</label>
                    <input type="number" id="assessorId" name="assessorId" value={form.assessorId} onChange={onChange} required className={FIELD} />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
                >
                    Register
                </button>
            </form>
        </div>
    );
}
export default RiskAssessmentRegisterForm;
