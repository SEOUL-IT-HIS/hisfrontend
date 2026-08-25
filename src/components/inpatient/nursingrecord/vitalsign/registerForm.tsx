
"use client";

import { AppDispatch, RootState } from "@/store/store";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { isOutOfNormalRange,  VITAL_SIGN_NORMAL_RANGES } from "@/features/inpatient/nursingrecord/vitalsign/validation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createVitalSignRequest } from "@/features/inpatient/nursingrecord/vitalsign/slice";

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
        <div>
            <h2>활력 징후 등록</h2>
            {loading && <p>로딩중...</p>}
            {error && <p>{error}</p>}
            <form onSubmit={onSubmit}>
                <div>
                    <label htmlFor="admissionId">입원ID:</label>
                    <input type="text" id="admissionId" name="admissionId" value={form.admissionId} onChange={onChange} required />
                </div>
                <div>
                    <label htmlFor="measuredAt">측정일시:</label>
                    <input type="datetime-local" id="measuredAt" name="measuredAt" value={form.measuredAt} onChange={onChange} required />
                </div>
                <div>
                    <label htmlFor="temperature">체온(°C):</label>
                    <input type="number" id="temperature" name="temperature" value={form.temperature} onChange={onChange} step="0.1" min="30" max="45" required />
                    {form.temperature && isOutOfNormalRange("temperature", Number(form.temperature)) && (
                    <span style={{ color: "red" }}>
                        정상범위({VITAL_SIGN_NORMAL_RANGES.temperature.min}~{VITAL_SIGN_NORMAL_RANGES.temperature.max}{VITAL_SIGN_NORMAL_RANGES.temperature.unit}) 벗어남
                    </span>
                    )}
                </div>

                <div>
                    <label htmlFor="pulse">맥박(회/분):</label>
                    <input type="number" id="pulse" name="pulse" value={form.pulse} onChange={onChange} min="50" max="150" required />
                    {form.pulse && isOutOfNormalRange("pulse", Number(form.pulse)) && (
                        <span style={{ color: "red" }}>
                            정상범위({VITAL_SIGN_NORMAL_RANGES.pulse.min}~{VITAL_SIGN_NORMAL_RANGES.pulse.max}{VITAL_SIGN_NORMAL_RANGES.pulse.unit}) 벗어남
                        </span>
                    )}
                </div>
                <div>
                    <label htmlFor="respiration">호흡수(회/분):</label>
                    <input type="number" id="respiration" name="respiration" value={form.respiration} onChange={onChange} min="12" max="20" required />
                    {form.respiration && isOutOfNormalRange("respiration", Number(form.respiration)) && (
                        <span style={{ color: "red" }}>
                            정상범위({VITAL_SIGN_NORMAL_RANGES.respiration.min}~{VITAL_SIGN_NORMAL_RANGES.respiration.max}{VITAL_SIGN_NORMAL_RANGES.respiration.unit}) 벗어남
                        </span>
                    )}
                </div>
                <div>
                    <label htmlFor="bpSystolic">수축기 혈압(mmHg):</label>
                    <input type="number" id="bpSystolic" name="bpSystolic" value={form.bpSystolic} onChange={onChange} min="0" required />
                    {form.bpSystolic && isOutOfNormalRange("bpSystolic", Number(form.bpSystolic)) && (
                        <span style={{ color: "red" }}>
                            정상범위({VITAL_SIGN_NORMAL_RANGES.bpSystolic.min}~{VITAL_SIGN_NORMAL_RANGES.bpSystolic.max}{VITAL_SIGN_NORMAL_RANGES.bpSystolic.unit}) 벗어남
                        </span>
                    )}
                </div>
                <div>
                    <label htmlFor="bpDiastolic">이완기 혈압(mmHg):</label>
                    <input type="number" id="bpDiastolic" name="bpDiastolic" value={form.bpDiastolic} onChange={onChange} min="0" required />
                    {form.bpDiastolic && isOutOfNormalRange("bpDiastolic", Number(form.bpDiastolic)) && (
                        <span style={{ color: "red" }}>
                            정상범위({VITAL_SIGN_NORMAL_RANGES.bpDiastolic.min}~{VITAL_SIGN_NORMAL_RANGES.bpDiastolic.max}{VITAL_SIGN_NORMAL_RANGES.bpDiastolic.unit}) 벗어남
                        </span>
                    )}
                </div>
                <div>
                    <label htmlFor="spo2">산소포화도(%):</label>
                    <input type="number" id="spo2" name="spo2" value={form.spo2} onChange={onChange} step="0.1" min="0" max="100" required />
                    {form.spo2 && isOutOfNormalRange("spo2", Number(form.spo2)) && (
                        <span style={{ color: "red" }}>
                            정상범위({VITAL_SIGN_NORMAL_RANGES.spo2.min}~{VITAL_SIGN_NORMAL_RANGES.spo2.max}{VITAL_SIGN_NORMAL_RANGES.spo2.unit}) 벗어남
                        </span>
                    )}
                </div>
                <div>
                    <label htmlFor="recorderId">측정자ID:</label>
                    <input type="number" id="recorderId" name="recorderId" value={form.recorderId} onChange={onChange} min="0" required />
                </div>
                <button type="submit" disabled={loading}>등록</button>
            </form>
        </div>
    );
}
export default VitalSignRegisterForm;
