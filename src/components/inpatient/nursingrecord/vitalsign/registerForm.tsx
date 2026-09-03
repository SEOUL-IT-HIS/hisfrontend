"use client";

import { AppDispatch, RootState } from "@/store/store";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { isOutOfNormalRange,  VITAL_SIGN_NORMAL_RANGES } from "@/features/inpatient/nursingrecord/vitalsign/validation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createVitalSignRequest } from "@/features/inpatient/nursingrecord/vitalsign/slice";

const LABEL = "mb-1 block text-sm font-medium text-slate-700";
const FIELD = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";
const WARNING = "mt-1 text-xs text-red-600";

const VitalSignRegisterForm = () => {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error, success } = useSelector((state: RootState) => ({
        loading: state.inpatient.vitalsign.createStatus.loading,
        error: state.inpatient.vitalsign.createStatus.error,
        success: state.inpatient.vitalsign.createStatus.success,
    }), shallowEqual);

    const [form, setForm] = useState({
        admissionId: "",
        measuredAt: "",
        temperature: "",
        pulse: "",
        respiration: "",
        bpSystolic: "",
        bpDiastolic: "",
        spo2: "",
        recorderId: "",
    });

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prevForm) => ({ ...prevForm, [name]: value }));
    };

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        dispatch(createVitalSignRequest({
            admissionId: form.admissionId,
            measuredAt: new Date(form.measuredAt),
            temperature: Number(form.temperature),
            pulse: Number(form.pulse),
            respiration: Number(form.respiration),
            bpSystolic: Number(form.bpSystolic),
            bpDiastolic: Number(form.bpDiastolic),
            spo2: Number(form.spo2),
            recorderId: Number(form.recorderId),
        }));
    };

    useEffect(() => {
        if (success) {
            router.push("/inpatient/nursingrecord/vitalsign/list");
        }
    }, [success, router]);

    return (
        <div className="mx-auto w-full max-w-lg p-6">
            <div className="mb-6">
                <h1 className="text-lg font-semibold text-slate-800">Register Vital Signs</h1>
                <p className="mt-1 text-sm text-slate-500">Register a patient's vital sign measurements.</p>
            </div>

            {loading && <p className="mb-3 text-sm text-slate-500">Loading...</p>}
            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

            <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                    <label htmlFor="admissionId" className={LABEL}>Admission ID</label>
                    <input type="text" id="admissionId" name="admissionId" value={form.admissionId} onChange={onChange} required className={FIELD} />
                </div>
                <div>
                    <label htmlFor="measuredAt" className={LABEL}>Measured At</label>
                    <input type="datetime-local" id="measuredAt" name="measuredAt" value={form.measuredAt} onChange={onChange} required className={FIELD} />
                </div>
                <div>
                    <label htmlFor="temperature" className={LABEL}>Temperature (°C)</label>
                    <input type="number" id="temperature" name="temperature" value={form.temperature} onChange={onChange} step="0.1" min="30" max="45" required className={FIELD} />
                    {form.temperature && isOutOfNormalRange("temperature", Number(form.temperature)) && (
                        <p className={WARNING}>
                            Outside normal range ({VITAL_SIGN_NORMAL_RANGES.temperature.min}~{VITAL_SIGN_NORMAL_RANGES.temperature.max}{VITAL_SIGN_NORMAL_RANGES.temperature.unit})
                        </p>
                    )}
                </div>

                <div>
                    <label htmlFor="pulse" className={LABEL}>Pulse (beats/min)</label>
                    <input type="number" id="pulse" name="pulse" value={form.pulse} onChange={onChange} min="50" max="150" required className={FIELD} />
                    {form.pulse && isOutOfNormalRange("pulse", Number(form.pulse)) && (
                        <p className={WARNING}>
                            Outside normal range ({VITAL_SIGN_NORMAL_RANGES.pulse.min}~{VITAL_SIGN_NORMAL_RANGES.pulse.max}{VITAL_SIGN_NORMAL_RANGES.pulse.unit})
                        </p>
                    )}
                </div>
                <div>
                    <label htmlFor="respiration" className={LABEL}>Respiration Rate (breaths/min)</label>
                    <input type="number" id="respiration" name="respiration" value={form.respiration} onChange={onChange} min="12" max="20" required className={FIELD} />
                    {form.respiration && isOutOfNormalRange("respiration", Number(form.respiration)) && (
                        <p className={WARNING}>
                            Outside normal range ({VITAL_SIGN_NORMAL_RANGES.respiration.min}~{VITAL_SIGN_NORMAL_RANGES.respiration.max}{VITAL_SIGN_NORMAL_RANGES.respiration.unit})
                        </p>
                    )}
                </div>
                <div>
                    <label htmlFor="bpSystolic" className={LABEL}>Systolic Blood Pressure (mmHg)</label>
                    <input type="number" id="bpSystolic" name="bpSystolic" value={form.bpSystolic} onChange={onChange} min="0" required className={FIELD} />
                    {form.bpSystolic && isOutOfNormalRange("bpSystolic", Number(form.bpSystolic)) && (
                        <p className={WARNING}>
                            Outside normal range ({VITAL_SIGN_NORMAL_RANGES.bpSystolic.min}~{VITAL_SIGN_NORMAL_RANGES.bpSystolic.max}{VITAL_SIGN_NORMAL_RANGES.bpSystolic.unit})
                        </p>
                    )}
                </div>
                <div>
                    <label htmlFor="bpDiastolic" className={LABEL}>Diastolic Blood Pressure (mmHg)</label>
                    <input type="number" id="bpDiastolic" name="bpDiastolic" value={form.bpDiastolic} onChange={onChange} min="0" required className={FIELD} />
                    {form.bpDiastolic && isOutOfNormalRange("bpDiastolic", Number(form.bpDiastolic)) && (
                        <p className={WARNING}>
                            Outside normal range ({VITAL_SIGN_NORMAL_RANGES.bpDiastolic.min}~{VITAL_SIGN_NORMAL_RANGES.bpDiastolic.max}{VITAL_SIGN_NORMAL_RANGES.bpDiastolic.unit})
                        </p>
                    )}
                </div>
                <div>
                    <label htmlFor="spo2" className={LABEL}>SpO2 (%)</label>
                    <input type="number" id="spo2" name="spo2" value={form.spo2} onChange={onChange} step="0.1" min="0" max="100" required className={FIELD} />
                    {form.spo2 && isOutOfNormalRange("spo2", Number(form.spo2)) && (
                        <p className={WARNING}>
                            Outside normal range ({VITAL_SIGN_NORMAL_RANGES.spo2.min}~{VITAL_SIGN_NORMAL_RANGES.spo2.max}{VITAL_SIGN_NORMAL_RANGES.spo2.unit})
                        </p>
                    )}
                </div>
                <div>
                    <label htmlFor="recorderId" className={LABEL}>Recorder ID</label>
                    <input type="number" id="recorderId" name="recorderId" value={form.recorderId} onChange={onChange} min="0" required className={FIELD} />
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
export default VitalSignRegisterForm;
