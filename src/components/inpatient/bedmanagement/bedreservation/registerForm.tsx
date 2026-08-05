"use client";

import { AppDispatch, RootState } from "@/store/store";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createBedReservationRequest } from "@/features/inpatient/bedmanagement/bedreservation/slice";
import { fetchBedRequest, selectBed } from "@/features/inpatient/bedmanagement/bedstatus/slice";

const BedReservationRegisterForm = () => {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error, success } = useSelector((state: RootState) => ({
        loading: state.inpatient.bedreservation.createStatus.loading,
        error: state.inpatient.bedreservation.createStatus.error,
        success: state.inpatient.bedreservation.createStatus.success,
    }), shallowEqual);

    const[form, setForm] = useState({
        bedId: "",
        patientId: "",
        reserveAt: "",
        expectedAdmissionAt: "",
        
    });
      const beds = useSelector(selectBed);
      useEffect(() => {
        dispatch(fetchBedRequest());
      }, [dispatch]);

      const emptyBeds = useMemo(
        () => beds.filter((bed) => bed.bedStatus === "EMPTY"),
        [beds]
        );


    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((prevForm) => ({...prevForm, [name]: value }));}
    
    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        dispatch(createBedReservationRequest({ ...form }));
    };
    useEffect(() => {
        if (success) {
            router.push("/inpatient/bedmanagement/bedreservation/list");
        }
    }, [success, router]);
    return (
        <div>
            <h2>병상 예약 등록</h2>
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
                    <label htmlFor="patientId">환자ID:</label>
                    <input type="text" id="patientId" name="patientId" value={form.patientId} onChange={onChange} required />
                </div>
                <div>
                    <label htmlFor="reserveAt">예약시각:</label>
                    <input type="datetime-local" id="reserveAt" name="reserveAt" value={form.reserveAt} onChange={onChange} required />
                </div>
                <div>
                    <label htmlFor="expectedAdmissionAt">예상입원시각:</label>
                    <input type="datetime-local" id="expectedAdmissionAt" name="expectedAdmissionAt" value={form.expectedAdmissionAt} onChange={onChange} required />
                </div>
                
                <button type="submit">등록</button>
            </form>
        </div>
    );
}
export default BedReservationRegisterForm;