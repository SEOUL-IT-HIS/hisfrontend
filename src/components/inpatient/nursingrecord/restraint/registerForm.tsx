"use client";

import { AppDispatch } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createRestraintRequest, selectRestraintCreateStatus } from "@/features/inpatient/nursingrecord/restraint/slice";

const LABEL = "mb-1 block text-sm font-medium text-slate-700";
const FIELD = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

const RestraintRegisterForm = () => {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error, success } = useSelector(selectRestraintCreateStatus);

    const [form, setForm] = useState({
        admissionId: "",
        restraintTypeCd: "",
        appliedAt: "",
        reason: "",
        doctorOrderId: "",
        evaluatorId: "",
    });

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prevForm) => ({ ...prevForm, [name]: value }));
    };

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        dispatch(createRestraintRequest({
            admissionId: form.admissionId,
            restraintTypeCd: form.restraintTypeCd,
            appliedAt: new Date(form.appliedAt),
            reason: form.reason,
            doctorOrderId: form.doctorOrderId,
            evaluatorId: form.evaluatorId,
        }));
    };

    useEffect(() => {
        if (success) {
            router.push("/inpatient/nursingrecord/restraint/list");
        }
    }, [success, router]);

    return (
        <div className="mx-auto w-full max-w-lg p-6">
            <div className="mb-6">
                <h1 className="text-lg font-semibold text-slate-800">Register Patient Restraint</h1>
                <p className="mt-1 text-sm text-slate-500">Register a patient's restraint application record.</p>
            </div>

            {loading && <p className="mb-3 text-sm text-slate-500">Loading...</p>}
            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

            <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                    <label htmlFor="admissionId" className={LABEL}>Admission ID</label>
                    <input type="text" id="admissionId" name="admissionId" value={form.admissionId} onChange={onChange} required className={FIELD} />
                </div>
                <div>
                    <label htmlFor="restraintTypeCd" className={LABEL}>Restraint Type Code</label>
                    <input type="text" id="restraintTypeCd" name="restraintTypeCd" value={form.restraintTypeCd} onChange={onChange} required className={FIELD} />
                </div>
                <div>
                    <label htmlFor="appliedAt" className={LABEL}>Applied At</label>
                    <input type="datetime-local" id="appliedAt" name="appliedAt" value={form.appliedAt} onChange={onChange} required className={FIELD} />
                </div>
                <div>
                    <label htmlFor="reason" className={LABEL}>Reason</label>
                    <input type="text" id="reason" name="reason" value={form.reason} onChange={onChange} required className={FIELD} />
                </div>
                <div>
                    <label htmlFor="doctorOrderId" className={LABEL}>Doctor Order ID</label>
                    <input type="text" id="doctorOrderId" name="doctorOrderId" value={form.doctorOrderId} onChange={onChange} required className={FIELD} />
                </div>
                <div>
                    <label htmlFor="evaluatorId" className={LABEL}>Evaluator ID</label>
                    <input type="text" id="evaluatorId" name="evaluatorId" value={form.evaluatorId} onChange={onChange} required className={FIELD} />
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
export default RestraintRegisterForm;
