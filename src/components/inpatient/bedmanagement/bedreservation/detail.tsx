"use client"

import { fetchBedReservationDetailRequest,deleteBedReservationRequest } from "@/features/inpatient/bedmanagement/bedreservation/slice";

import { RootState } from "@/store/store";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

const BedReservationDetail=()=>{
    const dispatch=useDispatch();
    const { bedReservationId: bedReservationIdParam }:{bedReservationId:string} = useParams();
    const bedReservationId = Number(bedReservationIdParam);
    const bedReservation=useSelector((state:RootState)=>state.inpatient.bedreservation.detail);
    const updateStatus = useSelector((state: RootState) => state.inpatient.bedreservation.updateStatus);
    const deleteStatus = useSelector((state: RootState) => state.inpatient.bedreservation.deleteStatus);
    const {loading,error}=useSelector((state:RootState)=>state.inpatient.bedreservation.detailStatus);
    useEffect(()=>{
        if (!bedReservationId) return;
        dispatch(fetchBedReservationDetailRequest(bedReservationId));
    },[bedReservationId]);

    useEffect(() => {
        if (updateStatus.success && bedReservationId) {
            dispatch(fetchBedReservationDetailRequest(bedReservationId));
        }
    }, [updateStatus.success, bedReservationId]);

    const handleDelete = () => {
        if (!bedReservationId) return;
        dispatch(deleteBedReservationRequest(bedReservationId));
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
            </div>
            }
        </div>
    );
}

export default BedReservationDetail;
