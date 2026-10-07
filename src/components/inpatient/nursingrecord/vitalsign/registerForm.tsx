"use client";

import { AppDispatch, RootState } from "@/store/store";
import NurseSelect from "@/components/inpatient/nursingrecord/NurseSelect";
import AdmissionSelect from "@/components/inpatient/nursingrecord/AdmissionSelect";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import VitalSignField from "@/components/inpatient/nursingrecord/vitalsign/VitalSignField";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDayEnd, futureTimeError, useNowInput } from "@/features/inpatient/dateLimits";
import { createVitalSignRequest, resetVitalSignCreateStatus } from "@/features/inpatient/nursingrecord/vitalsign/slice";
import { LABEL, FIELD } from "@/components/inpatient/common/styles";
import { Alert, Button, PageHeader } from "@/components/common";


const VitalSignRegisterForm = () => {
    // 기록 시각은 미래일 수 없음 — 화면은 오늘까지만 선택, 시각과 입원일 하한은 서버가 검증
    const maxRecordAt = useDayEnd();
    const router = useRouter();
    // 간호기록 홈에서 환자를 선택하고 들어오면 ?admissionId=가 붙어 옴 → 입원 ID 자동 입력 + 수정 불가
    const presetAdmissionId = useSearchParams().get("admissionId") ?? "";
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error, success } = useSelector((state: RootState) => ({
        loading: state.inpatient.vitalsign.createStatus.loading,
        error: state.inpatient.vitalsign.createStatus.error,
        success: state.inpatient.vitalsign.createStatus.success,
    }), shallowEqual);

    // 기록자 기본값 = 로그인한 사용자(간호사). 다른 간호사로 바꿀 수 있음

    const loginEmpId = useSelector((state: RootState) => state.auth.user?.empId ?? "");

    const [form, setForm] = useState({
        admissionId: presetAdmissionId,
        measuredAt: "",
        temperature: "",
        pulse: "",
        respiration: "",
        bpSystolic: "",
        bpDiastolic: "",
        spo2: "",
        recorderId: loginEmpId,
    });
    // 기록 시각 기본값을 지금으로 — 화면을 연 직후 한 번만 채움 (서버 렌더 땐 값이 없어서 클라이언트에서 채움)
    const nowInput = useNowInput();
    const [timePrefilled, setTimePrefilled] = useState(false);
    if (nowInput && !timePrefilled) {
        setTimePrefilled(true);
        setForm((prev) => ({ ...prev, measuredAt: prev.measuredAt || nowInput }));
    }
    // 제출 직전 미래 시각 확인 결과 (서버도 같은 기준으로 거절함)
    const [timeError, setTimeError] = useState<string | null>(null);

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((prevForm) => ({ ...prevForm, [name]: value }));
    };

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const futureError = futureTimeError(form.measuredAt, "Measured at");
        setTimeError(futureError);
        if (futureError) return;
        dispatch(createVitalSignRequest({
            admissionId: form.admissionId,
            measuredAt: new Date(form.measuredAt),
            temperature: Number(form.temperature),
            pulse: Number(form.pulse),
            respiration: Number(form.respiration),
            bpSystolic: Number(form.bpSystolic),
            bpDiastolic: Number(form.bpDiastolic),
            spo2: Number(form.spo2),
            recorderId: form.recorderId, // 직원 ID(empId) 문자열 그대로
        }));
    };

    useEffect(() => {
        if (!success) return;
        dispatch(resetVitalSignCreateStatus());
        // 환자를 선택하고 들어왔으면 간호기록 홈의 그 환자·Vital Sign 탭으로, 아니면 기존처럼 단독 목록으로
        router.push(presetAdmissionId
            ? `/inpatient/nursingrecord?admissionId=${presetAdmissionId}&tab=vitalsign`
            : "/inpatient/nursingrecord/vitalsign/list");
    }, [success, router, dispatch, presetAdmissionId]);

    return (
        <div className="mx-auto flex w-full max-w-lg flex-col gap-4 p-6">
            <PageHeader title="Register Vital Signs" description="Register a patient's vital sign measurements." />

            {loading && <p className="text-sm text-slate-400">Loading...</p>}
            {error && <Alert>{error}</Alert>}
            {timeError && <Alert>{timeError}</Alert>}

            <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <div>
                    <label htmlFor="admissionId" className={LABEL}>Patient (Admission)</label>
                    <AdmissionSelect id="admissionId" name="admissionId" value={form.admissionId} onChange={onChange} locked={!!presetAdmissionId} className={FIELD} />
                </div>
                <div>
                    <label htmlFor="measuredAt" className={LABEL}>Measured At</label>
                    <input type="datetime-local" id="measuredAt" name="measuredAt" max={maxRecordAt} value={form.measuredAt} onChange={onChange} required className={FIELD} />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <VitalSignField field="temperature" value={form.temperature} onChange={onChange} />
                    <VitalSignField field="pulse" value={form.pulse} onChange={onChange} />
                    <VitalSignField field="respiration" value={form.respiration} onChange={onChange} />
                    <VitalSignField field="spo2" value={form.spo2} onChange={onChange} />
                    <VitalSignField field="bpSystolic" value={form.bpSystolic} onChange={onChange} />
                    <VitalSignField field="bpDiastolic" value={form.bpDiastolic} onChange={onChange} />
                </div>
                <div>
                    <label htmlFor="recorderId" className={LABEL}>Recorder (Nurse)</label>
                    <NurseSelect id="recorderId" name="recorderId" value={form.recorderId} onChange={onChange} className={FIELD} />
                </div>
                <Button className="w-full"
                    type="submit"
                    disabled={loading}
                >
                    Register
                </Button>
            </form>
        </div>
    );
}
export default VitalSignRegisterForm;
