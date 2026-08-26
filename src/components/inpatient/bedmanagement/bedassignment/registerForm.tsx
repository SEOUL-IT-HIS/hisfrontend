"use client";

import { AppDispatch, RootState } from "@/store/store";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { createBedAssignmentRequest } from "@/features/inpatient/bedmanagement/bedassignment/slice";
import { fetchBedRequest, selectBed } from "@/features/inpatient/bedmanagement/bedstatus/slice";
import { fetchAdmissionsRequest, selectAdmissions } from "@/features/inpatient/admissiondischarge/slice";
import { fetchBedAssignmentsRequest, selectBedAssignments } from "@/features/inpatient/bedmanagement/bedassignment/slice";

const LABEL = "mb-1 block text-sm font-medium text-slate-700";
const FIELD = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

const BedAssignmentRegisterForm = () => {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const searchParams = useSearchParams();
    const admissionIdParam = searchParams.get("admissionId");
    const { loading, error, success } = useSelector((state: RootState) => ({
        loading: state.inpatient.bedmanagement.createStatus.loading,
        error: state.inpatient.bedmanagement.createStatus.error,
        success: state.inpatient.bedmanagement.createStatus.success,
    }), shallowEqual);
    const beds = useSelector(selectBed);
    const admissions = useSelector(selectAdmissions);
    const bedAssignments = useSelector(selectBedAssignments);
    const[form, setForm] = useState({
        bedId: "",
        admissionId: admissionIdParam ?? "",
        assignedAt: "",
        releasedAt: "",
    });

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {

        const { name, value } = e.target;
        setForm((prevForm) => ({...prevForm, [name]: value }));}

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        dispatch(createBedAssignmentRequest({ ...form, releasedAt: null }));
    };
    useEffect(() => {
        dispatch(fetchBedRequest());
        dispatch(fetchAdmissionsRequest());
        dispatch(fetchBedAssignmentsRequest());
    }, [dispatch]);
    const emptyBeds = useMemo(() => beds.filter((bed) => bed.bedStatus === "EMPTY"), [beds]);

    const assignedAdmissionIds = useMemo( () => bedAssignments.filter((ba)=>ba.releasedAt === null).map((ba) => ba.admissionId), [bedAssignments]);
    const availableAdmissions = useMemo(() => admissions.filter((admission) => !assignedAdmissionIds.includes(admission.admissionId)), [admissions, assignedAdmissionIds]);

    useEffect(() => {
        if (success) {
            router.push("/inpatient/bedmanagement/bedassignment/list");
        }
    }, [success, router]);
    return (
        <div className="mx-auto w-full max-w-lg p-6">
            <div className="mb-6">
                <h1 className="text-lg font-semibold text-slate-800">병상 배정 등록</h1>
                <p className="mt-1 text-sm text-slate-500">환자를 병상에 배정합니다.</p>
            </div>

            {loading && <p className="mb-3 text-sm text-slate-500">로딩중...</p>}
            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

            <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                    <label htmlFor="bedId" className={LABEL}>병상ID</label>
                    <select id="bedId" name="bedId" value={form.bedId} onChange={onChange} required className={FIELD}>
                        <option value="">선택하세요</option>
                        {emptyBeds.map((bed) => (
                            <option key={bed.bedId} value={bed.bedId}>
                                {bed.roomNo}호 {bed.bedNo}번
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="admissionId" className={LABEL}>입원ID</label>
                    {admissionIdParam ? (
                        <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{form.admissionId}</div>
                    ) : (
                        <select id="admissionId" name="admissionId" value={form.admissionId} onChange={onChange} required className={FIELD}>
                            <option value="">선택하세요</option>
                            {availableAdmissions.map((admission) => (
                                <option key={admission.admissionId} value={admission.admissionId}>
                                    {admission.admissionId}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
                <div>
                    <label htmlFor="assignedAt" className={LABEL}>배정시각</label>
                    <input type="datetime-local" id="assignedAt" name="assignedAt" value={form.assignedAt} onChange={onChange} required className={FIELD} />
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
}
export default BedAssignmentRegisterForm;
