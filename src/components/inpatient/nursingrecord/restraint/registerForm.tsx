"use client";

import { AppDispatch, RootState } from "@/store/store";
import StaffSelect from "@/components/inpatient/nursingrecord/StaffSelect";
import { RESTRAINT_TYPE_OPTIONS } from "@/features/inpatient/nursingrecord/codes";
import CodeSelect from "@/components/inpatient/nursingrecord/CodeSelect";
import NurseSelect from "@/components/inpatient/nursingrecord/NurseSelect";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createRestraintRequest, resetRestraintCreateStatus, selectRestraintCreateStatus } from "@/features/inpatient/nursingrecord/restraint/slice";

const LABEL = "mb-1 block text-sm font-medium text-slate-700";
const FIELD = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

const RestraintRegisterForm = () => {
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

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
        if (!success) return;
        dispatch(resetRestraintCreateStatus());
        // 환자를 선택하고 들어왔으면 간호기록 홈의 그 환자·해당 탭으로, 아니면 기존처럼 단독 목록으로
        router.push(presetAdmissionId
            ? `/inpatient/nursingrecord?admissionId=${presetAdmissionId}&tab=restraint`
            : "/inpatient/nursingrecord/restraint/list");
    }, [success, router, dispatch, presetAdmissionId]);

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
                    <input type="text" id="admissionId" name="admissionId" value={form.admissionId} onChange={onChange} required readOnly={!!presetAdmissionId} className={`${FIELD} ${presetAdmissionId ? "bg-slate-50 text-slate-500" : ""}`} />
                </div>
                <div>
                    <label htmlFor="restraintTypeCd" className={LABEL}>Restraint Type</label>
                    <CodeSelect id="restraintTypeCd" name="restraintTypeCd" value={form.restraintTypeCd} options={RESTRAINT_TYPE_OPTIONS} onChange={onChange} className={FIELD} />
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
                    <label htmlFor="doctorOrderId" className={LABEL}>Ordering Doctor</label>
                    <StaffSelect role="DOCTOR" id="doctorOrderId" name="doctorOrderId" value={form.doctorOrderId} onChange={onChange} className={FIELD} />
                </div>
                <div>
                    <label htmlFor="evaluatorId" className={LABEL}>Evaluator (Nurse)</label>
                    <NurseSelect id="evaluatorId" name="evaluatorId" value={form.evaluatorId} onChange={onChange} className={FIELD} />
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
