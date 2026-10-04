"use client";

import { AppDispatch, RootState } from "@/store/store";
import { ALL_IO_ROUTE_OPTIONS, IO_ROUTE_OPTIONS, IO_TYPE_OPTIONS } from "@/features/inpatient/nursingrecord/codes";
import CodeSelect from "@/components/inpatient/nursingrecord/CodeSelect";
import NurseSelect from "@/components/inpatient/nursingrecord/NurseSelect";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDayEnd } from "@/features/inpatient/dateLimits";
import { createIandORecordRequest, resetIandORecordCreateStatus, selectIandORecordCreateStatus } from "@/features/inpatient/nursingrecord/iandorecord/slice";

const LABEL = "mb-1 block text-sm font-medium text-slate-700";
const FIELD = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

const IandORecordRegisterForm = () => {
    // 기록 시각은 미래일 수 없음 — 화면은 오늘까지만 선택, 시각과 입원일 하한은 서버가 검증
    const maxRecordAt = useDayEnd();
    const router = useRouter();
    // 간호기록 홈에서 환자를 선택하고 들어오면 ?admissionId=가 붙어 옴 → 입원 ID 자동 입력 + 수정 불가
    const presetAdmissionId = useSearchParams().get("admissionId") ?? "";
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error, success } = useSelector(selectIandORecordCreateStatus);

    // 기록자 기본값 = 로그인한 사용자(간호사). 다른 간호사로 바꿀 수 있음

    const loginEmpId = useSelector((state: RootState) => state.auth.user?.empId ?? "");

    const [form, setForm] = useState({
        admissionId: presetAdmissionId,
        recordedAt: "",
        ioTypeCd: "",
        routeCd: "",
        amountMl: "",
        recorderId: loginEmpId,
    });

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
            recorderId: form.recorderId, // 직원 ID(empId) 문자열 그대로
        }));
    };

    useEffect(() => {
        if (!success) return;
        dispatch(resetIandORecordCreateStatus());
        // 환자를 선택하고 들어왔으면 간호기록 홈의 그 환자·해당 탭으로, 아니면 기존처럼 단독 목록으로
        router.push(presetAdmissionId
            ? `/inpatient/nursingrecord?admissionId=${presetAdmissionId}&tab=iandorecord`
            : "/inpatient/nursingrecord/iandorecord/list");
    }, [success, router, dispatch, presetAdmissionId]);

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
                    <input type="text" id="admissionId" name="admissionId" value={form.admissionId} onChange={onChange} required readOnly={!!presetAdmissionId} className={`${FIELD} ${presetAdmissionId ? "bg-slate-50 text-slate-500" : ""}`} />
                </div>
                <div>
                    <label htmlFor="recordedAt" className={LABEL}>Recorded At</label>
                    <input type="datetime-local" id="recordedAt" name="recordedAt" max={maxRecordAt} value={form.recordedAt} onChange={onChange} required className={FIELD} />
                </div>
                <div>
                    <label htmlFor="ioTypeCd" className={LABEL}>I/O Type</label>
                    <CodeSelect id="ioTypeCd" name="ioTypeCd" value={form.ioTypeCd} options={IO_TYPE_OPTIONS} onChange={onChange} className={FIELD} />
                </div>
                <div>
                    <label htmlFor="routeCd" className={LABEL}>Route</label>
                    <CodeSelect id="routeCd" name="routeCd" value={form.routeCd} options={IO_ROUTE_OPTIONS[form.ioTypeCd] ?? ALL_IO_ROUTE_OPTIONS} onChange={onChange} className={FIELD} />
                </div>
                <div>
                    <label htmlFor="amountMl" className={LABEL}>Amount (mL)</label>
                    <input type="number" id="amountMl" name="amountMl" value={form.amountMl} onChange={onChange} required className={FIELD} />
                </div>
                <div>
                    <label htmlFor="recorderId" className={LABEL}>Recorder (Nurse)</label>
                    <NurseSelect id="recorderId" name="recorderId" value={form.recorderId} onChange={onChange} className={FIELD} />
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
