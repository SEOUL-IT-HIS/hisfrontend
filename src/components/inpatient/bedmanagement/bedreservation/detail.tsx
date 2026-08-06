"use client"

import { fetchBedReservationDetailRequest,deleteBedReservationRequest } from "@/features/inpatient/bedmanagement/bedreservation/slice";

import { RootState } from "@/store/store";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const BedReservationDetail=()=>{
    const dispatch=useDispatch();
    const { bedReservationId: bedReservationIdParam }:{bedReservationId:string} = useParams();
    const bedReservationId = Number(bedReservationIdParam);
    const bedReservation=useSelector((state:RootState)=>state.inpatient.bedreservation.detail);
    const updateStatus = useSelector((state: RootState) => state.inpatient.bedreservation.updateStatus);
    const deleteStatus = useSelector((state: RootState) => state.inpatient.bedreservation.deleteStatus);
    const scheduleUpdateStatus = useSelector((state: RootState) => state.inpatient.bedreservation.scheduleUpdateStatus);
    const [scheduleForm, setScheduleForm] = useState({ reserveAt: "", expectedAdmissionAt: "" });
    const {loading,error}=useSelector((state:RootState)=>state.inpatient.bedreservation.detailStatus);
    
    useEffect(() => {  
        if (scheduleUpdateStatus.success && bedReservationId) {
            dispatch(fetchBedReservationDetailRequest(bedReservationId));
        }
    }, [scheduleUpdateStatus.success, bedReservationId]);

    
    useEffect(()=>{
        if (!bedReservationId) return;
        dispatch(fetchBedReservationDetailRequest(bedReservationId));
    },[bedReservationId]);

    useEffect(() => {
        if (updateStatus.success && bedReservationId) {
            dispatch(fetchBedReservationDetailRequest(bedReservationId));
        }
    }, [updateStatus.success, bedReservationId]);

    useEffect(() =>{
        if(bedReservation){
            setScheduleForm({
                reserveAt: bedReservation.reserveAt,
                expectedAdmissionAt: bedReservation.expectedAdmissionAt,
            });
        }
    },[bedReservation]);

    const onScheduleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setScheduleForm((prevForm) => ({ ...prevForm, [name]: value }));
    };

    function handleDelete() {
        if (!bedReservationId) return;
        dispatch(deleteBedReservationRequest(bedReservationId));
    }
    function handleUpdateSchedule(reserveAt: string, expectedAdmissionAt: string) {
        if (!bedReservationId) return;
        dispatch({
            type: "bedReservation/updateBedReservationScheduleRequest",
            payload: { id: bedReservationId, reserveAt, expectedAdmissionAt }
        });
    }
    return(
        <div>
            { loading && <p>로딩중...</p> }
            { error && <p>{error}</p> }
            { !loading && bedReservation &&         
            <div>
            <p>BedReservationId: {bedReservation.bedReservationId}</p>
            <p>BedId: {bedReservation.bedId}</p>
            <p>PatientId: {bedReservation.patientId}</p>
            <p>ReserveAt: {bedReservation.reserveAt}</p>
            <p>ExpectedAdmissionAt: {bedReservation.expectedAdmissionAt}</p>
            <p>ReservationStatusCd: {bedReservation.reservationStatusCd}</p>
            <button onClick={handleDelete} disabled={deleteStatus.loading}>
                {deleteStatus.loading ? "삭제중..." : "삭제"}
            </button>
            <div>
                <label htmlFor="reserveAt">예약시각:</label>
                <input
                    type="datetime-local"
                    id="reserveAt"
                    name="reserveAt"
                    value={scheduleForm.reserveAt}
                    onChange={onScheduleChange}
                />
            </div>
            <div>
                <label htmlFor="expectedAdmissionAt">예상입원시각:</label>
                <input
                    type="datetime-local"
                    id="expectedAdmissionAt"
                    name="expectedAdmissionAt"
                    value={scheduleForm.expectedAdmissionAt}
                    onChange={onScheduleChange}
                />
            </div>
            <button onClick={() => handleUpdateSchedule(scheduleForm.reserveAt, scheduleForm.expectedAdmissionAt)} disabled={scheduleUpdateStatus.loading}>
                {scheduleUpdateStatus.loading ? "일정 업데이트중..." : "일정 업데이트"}
            </button>
            </div>
            }
        </div>
    );
}

export default BedReservationDetail;
