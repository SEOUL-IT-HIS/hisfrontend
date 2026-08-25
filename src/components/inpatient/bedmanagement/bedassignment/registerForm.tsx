
"use client";

import { AppDispatch, RootState } from "@/store/store";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { createBedAssignmentRequest } from "@/features/inpatient/bedmanagement/bedassignment/slice";
import { fetchBedRequest, selectBed } from "@/features/inpatient/bedmanagement/bedstatus/slice";
import { fetchAdmissionsRequest, selectAdmissions } from "@/features/inpatient/admissiondischarge/slice";
import { fetchBedAssignmentsRequest, selectBedAssignments } from "@/features/inpatient/bedmanagement/bedassignment/slice";


const BedAssignmentRegisterForm = () => {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
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
        admissionId: "",
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
        <div>
            <h2>병상 배정 등록</h2>
            {loading && <p>로딩중...</p>}
            {error && <p>{error}</p>}
            <form onSubmit={onSubmit}>
                <div>
                    <label htmlFor="bedId">병상ID:</label>
                    <select id="bedId" name="bedId" value={form.bedId} onChange={onChange} required>
                    <option value="">선택하세요</option>
                    {emptyBeds.map((bed) => (
                    <option key={bed.bedId} value={bed.bedId}>
                    {bed.roomNo}호 {bed.bedNo}번
                </option>
                ))}
                </select>
                </div>
                <div>
                    <label htmlFor="admissionId">입원ID:</label>
                    <select id="admissionId" name="admissionId" value={form.admissionId} onChange={onChange} required>
                        <option value="">선택하세요</option>
                        {availableAdmissions.map((admission) => (
                            <option key={admission.admissionId} value={admission.admissionId}>
                                {admission.admissionId}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="assignedAt">배정시각:</label>   
                    <input type="datetime-local" id="assignedAt" name="assignedAt" value={form.assignedAt} onChange={onChange} required />
                </div>
                <button type="submit">등록</button>
            </form>
        </div>
    );
}
export default BedAssignmentRegisterForm;