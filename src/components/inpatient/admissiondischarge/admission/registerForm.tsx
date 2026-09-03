"use client";

import { AppDispatch, RootState } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createAdmissionRequest, fetchAdmissionsRequest, selectAdmissionCreateStatus, selectAdmissions } from "@/features/inpatient/admissiondischarge/slice";
import { fetchPatientListRequest } from "@/features/patient/slice/patientSlice";

const LABEL = "mb-1 block text-sm font-medium text-slate-700";
const FIELD = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

const AdmissionRegisterForm = () => {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error, success } = useSelector(selectAdmissionCreateStatus);
    const patients = useSelector((state: RootState) => state.patient.patients);
    const admissions = useSelector(selectAdmissions);


    const [form, setForm] = useState({
        patientId: "",
        doctorId: "",
        admissionDate: "",
        admissionRoute: "",
        admissionDeptId: "",
    });

    useEffect(() => {
        dispatch(fetchPatientListRequest({}));
        dispatch(fetchAdmissionsRequest());
    }, [dispatch]);

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((prevForm) => ({ ...prevForm, [name]: value }));
    };

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        dispatch(createAdmissionRequest({ ...form, status: "REQUESTED" }));
    };

    useEffect(() => {
        if (success) {
            router.push("/inpatient/admissiondischarge/admission/list");
        }
    }, [success, router]);

    const activepatientIds = useMemo(
        () => new Set(admissions.filter((a)=>a.status !== "DISCHARGED").map((a) => a.patientId)),
        [admissions],
    );
    const availablePatients = useMemo(
        () => patients.filter((patient) => !activepatientIds.has(patient.patientId)),
        [patients, activepatientIds],
    );
    return (
        <div className="mx-auto w-full max-w-lg p-6">
            <div className="mb-6">
                <h1 className="text-lg font-semibold text-slate-800">입원 요청 등록</h1>
                <p className="mt-1 text-sm text-slate-500">
                    접수(원무) 연동 전까지 임시로 입원 요청을 직접 등록합니다.
                </p>
            </div>

            {loading && <p className="mb-3 text-sm text-slate-500">등록중...</p>}
            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

            <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                    <label htmlFor="patientId" className={LABEL}>환자</label>
                    <select id="patientId" name="patientId" value={form.patientId} onChange={onChange} required className={FIELD}>
                        <option value="">선택하세요</option>
                        {availablePatients.map((patient) => (
                            <option key={patient.patientId} value={patient.patientId}>
                                {patient.patientName}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="doctorId" className={LABEL}>담당의ID</label>
                    <input type="text" id="doctorId" name="doctorId" value={form.doctorId} onChange={onChange} required className={FIELD} />
                </div>
                <div>
                    <label htmlFor="admissionDeptId" className={LABEL}>입원과ID</label>
                    <input type="text" id="admissionDeptId" name="admissionDeptId" value={form.admissionDeptId} onChange={onChange} required className={FIELD} />
                </div>
                <div>
                    <label htmlFor="admissionRoute" className={LABEL}>입원경로</label>
                    <select id="admissionRoute" name="admissionRoute" value={form.admissionRoute} onChange={onChange} required className={FIELD}>
                        <option value="">선택하세요</option>
                        <option value="외래">외래</option>
                        <option value="응급">응급</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="admissionDate" className={LABEL}>입원일시</label>
                    <input type="datetime-local" id="admissionDate" name="admissionDate" value={form.admissionDate} onChange={onChange} required className={FIELD} />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
                >
                    등록
                </button>
            </form>
        </div>
    );
};

export default AdmissionRegisterForm;
