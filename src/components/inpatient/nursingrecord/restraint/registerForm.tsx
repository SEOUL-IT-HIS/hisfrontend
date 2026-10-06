"use client";

import { AppDispatch, RootState } from "@/store/store";
import StaffSelect from "@/components/inpatient/nursingrecord/StaffSelect";
import { RESTRAINT_TYPE_OPTIONS } from "@/features/inpatient/nursingrecord/codes";
import CodeSelect from "@/components/inpatient/nursingrecord/CodeSelect";
import NurseSelect from "@/components/inpatient/nursingrecord/NurseSelect";
import AdmissionSelect from "@/components/inpatient/nursingrecord/AdmissionSelect";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDayEnd, futureTimeError, useNowInput } from "@/features/inpatient/dateLimits";
import { createRestraintRequest, resetRestraintCreateStatus, selectRestraintCreateStatus } from "@/features/inpatient/nursingrecord/restraint/slice";
import { LABEL, FIELD } from "@/components/inpatient/common/styles";
import { Alert, Button, PageHeader } from "@/components/common";


const RestraintRegisterForm = () => {
    // 기록 시각은 미래일 수 없음 — 화면은 오늘까지만 선택, 시각과 입원일 하한은 서버가 검증
    const maxRecordAt = useDayEnd();
    const router = useRouter();
    // 간호기록 홈에서 환자를 선택하고 들어오면 ?admissionId=가 붙어 옴 → 입원 ID 자동 입력 + 수정 불가
    const presetAdmissionId = useSearchParams().get("admissionId") ?? "";
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error, success } = useSelector(selectRestraintCreateStatus);

    // 기록자 기본값 = 로그인한 사용자(간호사). 다른 간호사로 바꿀 수 있음

    const loginEmpId = useSelector((state: RootState) => state.auth.user?.empId ?? "");

    const [form, setForm] = useState({
        admissionId: presetAdmissionId,
        restraintTypeCd: "",
        appliedAt: "",
        reason: "",
        doctorOrderId: "",
        evaluatorId: loginEmpId,
    });
    // 기록 시각 기본값을 지금으로 — 화면을 연 직후 한 번만 채움 (서버 렌더 땐 값이 없어서 클라이언트에서 채움)
    const nowInput = useNowInput();
    const [timePrefilled, setTimePrefilled] = useState(false);
    if (nowInput && !timePrefilled) {
        setTimePrefilled(true);
        setForm((prev) => ({ ...prev, appliedAt: prev.appliedAt || nowInput }));
    }
    // 제출 직전 미래 시각 확인 결과 (서버도 같은 기준으로 거절함)
    const [timeError, setTimeError] = useState<string | null>(null);

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((prevForm) => ({ ...prevForm, [name]: value }));
    };

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const futureError = futureTimeError(form.appliedAt, "Applied at");
        setTimeError(futureError);
        if (futureError) return;
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
        if (!success) return;
        dispatch(resetRestraintCreateStatus());
        // 환자를 선택하고 들어왔으면 간호기록 홈의 그 환자·해당 탭으로, 아니면 기존처럼 단독 목록으로
        router.push(presetAdmissionId
            ? `/inpatient/nursingrecord?admissionId=${presetAdmissionId}&tab=restraint`
            : "/inpatient/nursingrecord/restraint/list");
    }, [success, router, dispatch, presetAdmissionId]);

    return (
        <div className="mx-auto flex w-full max-w-lg flex-col gap-4 p-6">
            <PageHeader title="Register Patient Restraint" description="Register a patient's restraint application record." />

            {loading && <p className="text-sm text-slate-400">Loading...</p>}
            {error && <Alert>{error}</Alert>}
            {timeError && <Alert>{timeError}</Alert>}

            <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <div>
                    <label htmlFor="admissionId" className={LABEL}>Patient (Admission)</label>
                    <AdmissionSelect id="admissionId" name="admissionId" value={form.admissionId} onChange={onChange} locked={!!presetAdmissionId} className={FIELD} />
                </div>
                <div>
                    <label htmlFor="restraintTypeCd" className={LABEL}>Restraint Type</label>
                    <CodeSelect id="restraintTypeCd" name="restraintTypeCd" value={form.restraintTypeCd} options={RESTRAINT_TYPE_OPTIONS} onChange={onChange} className={FIELD} />
                </div>
                <div>
                    <label htmlFor="appliedAt" className={LABEL}>Applied At</label>
                    <input type="datetime-local" id="appliedAt" name="appliedAt" max={maxRecordAt} value={form.appliedAt} onChange={onChange} required className={FIELD} />
                </div>
                <div>
                    <label htmlFor="reason" className={LABEL}>Reason</label>
                    <input type="text" id="reason" name="reason" value={form.reason} onChange={onChange} required className={FIELD} />
                </div>
                <div>
                    <label htmlFor="doctorOrderId" className={LABEL}>Ordering Doctor</label>
                    <StaffSelect role="DOCTOR" id="doctorOrderId" name="doctorOrderId" value={form.doctorOrderId} onChange={onChange} className={FIELD} />
                </div>
                <div>
                    <label htmlFor="evaluatorId" className={LABEL}>Evaluator (Nurse)</label>
                    <NurseSelect id="evaluatorId" name="evaluatorId" value={form.evaluatorId} onChange={onChange} className={FIELD} />
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
export default RestraintRegisterForm;
