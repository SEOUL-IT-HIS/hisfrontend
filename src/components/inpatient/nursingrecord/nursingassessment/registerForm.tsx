"use client";

import { AppDispatch } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createNursingAssessmentRequest, selectNursingAssessmentCreateStatus } from "@/features/inpatient/nursingrecord/nursingassessment/slice";

const LABEL = "mb-1 block text-sm font-medium text-slate-700";
const FIELD = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

const NursingAssessmentRegisterForm = () => {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error, success } = useSelector(selectNursingAssessmentCreateStatus);

    const [form, setForm] = useState({
        admissionId: "",
        allergyYn: "",
        allergyDetail: "",
        pastMedicalHistory: "",
        mentalStatusCd: "",
        assessedAt: "",
        assessorId: "",
    });

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prevForm) => ({ ...prevForm, [name]: value }));
    };

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        dispatch(createNursingAssessmentRequest({
            admissionId: form.admissionId,
            allergyYn: form.allergyYn,
            allergyDetail: form.allergyDetail,
            pastMedicalHistory: form.pastMedicalHistory,
            mentalStatusCd: form.mentalStatusCd,
            assessedAt: new Date(form.assessedAt),
            assessorId: Number(form.assessorId),
        }));
    };

    useEffect(() => {
        if (success) {
            router.push("/inpatient/nursingrecord/nursingassessment/list");
        }
    }, [success, router]);

    return (
        <div className="mx-auto w-full max-w-lg p-6">
            <div className="mb-6">
                <h1 className="text-lg font-semibold text-slate-800">Register Patient Nursing Assessment</h1>
                <p className="mt-1 text-sm text-slate-500">Register a patient's nursing assessment results.</p>
            </div>

            {loading && <p className="mb-3 text-sm text-slate-500">Loading...</p>}
            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

            <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                    <label htmlFor="admissionId" className={LABEL}>Admission ID</label>
                    <input type="text" id="admissionId" name="admissionId" value={form.admissionId} onChange={onChange} required className={FIELD} />
                </div>
                <div>
                    <label htmlFor="allergyYn" className={LABEL}>Allergy Yn</label>
                    <input type="text" id="allergyYn" name="allergyYn" value={form.allergyYn} onChange={onChange} required className={FIELD} />
                </div>
                <div>
                    <label htmlFor="allergyDetail" className={LABEL}>Allergy Detail</label>
                    <input type="text" id="allergyDetail" name="allergyDetail" value={form.allergyDetail} onChange={onChange} className={FIELD} />
                </div>
                <div>
                    <label htmlFor="pastMedicalHistory" className={LABEL}>Past Medical History</label>
                    <input type="text" id="pastMedicalHistory" name="pastMedicalHistory" value={form.pastMedicalHistory} onChange={onChange} className={FIELD} />
                </div>
                <div>
                    <label htmlFor="mentalStatusCd" className={LABEL}>Mental Status Code</label>
                    <input type="text" id="mentalStatusCd" name="mentalStatusCd" value={form.mentalStatusCd} onChange={onChange} required className={FIELD} />
                </div>
                <div>
                    <label htmlFor="assessedAt" className={LABEL}>Assessed At</label>
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
export default NursingAssessmentRegisterForm;
