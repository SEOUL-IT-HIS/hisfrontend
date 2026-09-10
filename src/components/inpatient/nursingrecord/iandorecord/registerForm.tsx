"use client";

import { AppDispatch } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createIandORecordRequest, selectIandORecordCreateStatus } from "@/features/inpatient/nursingrecord/iandorecord/slice";

const LABEL = "mb-1 block text-sm font-medium text-slate-700";
const FIELD = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

const IandORecordRegisterForm = () => {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error, success } = useSelector(selectIandORecordCreateStatus);

    const [form, setForm] = useState({
        admissionId: "",
        recordedAt: "",
        ioTypeCd: "",
        routeCd: "",
        amountMl: "",
        recorderId: "",
    });

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prevForm) => ({ ...prevForm, [name]: value }));
    };

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        dispatch(createIandORecordRequest({
            admissionId: form.admissionId,
            recordedAt: new Date(form.recordedAt),
            ioTypeCd: form.ioTypeCd,
            routeCd: form.routeCd,
            amountMl: Number(form.amountMl),
            recorderId: Number(form.recorderId),
        }));
    };

    useEffect(() => {
        if (success) {
            router.push("/inpatient/nursingrecord/iandorecord/list");
        }
    }, [success, router]);

    return (
        <div className="mx-auto w-full max-w-lg p-6">
            <div className="mb-6">
                <h1 className="text-lg font-semibold text-slate-800">Register Patient I&O Record</h1>
                <p className="mt-1 text-sm text-slate-500">Register a patient's intake/output record.</p>
            </div>

            {loading && <p className="mb-3 text-sm text-slate-500">Loading...</p>}
            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

            <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                    <label htmlFor="admissionId" className={LABEL}>Admission ID</label>
                    <input type="text" id="admissionId" name="admissionId" value={form.admissionId} onChange={onChange} required className={FIELD} />
                </div>
                <div>
                    <label htmlFor="recordedAt" className={LABEL}>Recorded At</label>
                    <input type="datetime-local" id="recordedAt" name="recordedAt" value={form.recordedAt} onChange={onChange} required className={FIELD} />
                </div>
                <div>
                    <label htmlFor="ioTypeCd" className={LABEL}>I/O Type Code</label>
                    <input type="text" id="ioTypeCd" name="ioTypeCd" value={form.ioTypeCd} onChange={onChange} required className={FIELD} />
                </div>
                <div>
                    <label htmlFor="routeCd" className={LABEL}>Route Code</label>
                    <input type="text" id="routeCd" name="routeCd" value={form.routeCd} onChange={onChange} required className={FIELD} />
                </div>
                <div>
                    <label htmlFor="amountMl" className={LABEL}>Amount (mL)</label>
                    <input type="number" id="amountMl" name="amountMl" value={form.amountMl} onChange={onChange} required className={FIELD} />
                </div>
                <div>
                    <label htmlFor="recorderId" className={LABEL}>Recorder ID</label>
                    <input type="number" id="recorderId" name="recorderId" value={form.recorderId} onChange={onChange} required className={FIELD} />
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
export default IandORecordRegisterForm;
