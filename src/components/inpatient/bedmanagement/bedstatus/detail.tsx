"use client"

import { fetchBedDetailRequest, selectBedDetail, selectBedDetailStatus } from "@/features/inpatient/bedmanagement/bedstatus/slice";
import { fetchPatientDetailRequest } from "@/features/patient/slice/patientSlice";
import type { AppDispatch, RootState } from "@/store/store";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

const BedStatusDetail=()=>{
    const dispatch=useDispatch<AppDispatch>();
    const { bedId }:{bedId:string} = useParams();
    const bed=useSelector(selectBedDetail);
    const {loading,error}=useSelector(selectBedDetailStatus);
    const patientDetail = useSelector((state: RootState) => state.patient.patientDetail);
    useEffect(()=>{
        if (!bedId) return;
        dispatch(fetchBedDetailRequest(bedId));
    },[bedId, dispatch]);

    useEffect(()=>{
        if (!bed?.patientId) return;
        dispatch(fetchPatientDetailRequest(bed.patientId));
    },[bed?.patientId, dispatch]);

    return(
        <div>
            { loading && <p>로딩중...</p> }
            { error && <p>{error}</p> }
            { !loading && bed &&


            <div>
            <p>환자명: {bed.patientId ? (patientDetail?.patientId === bed.patientId ? patientDetail.patientName : '조회중...') : '없음'}</p>
            <p>환자ID: {bed.patientId ?? '없음'}</p>
            <p>BedId: {bed.bedId}</p>
            <p>roomNo: {bed.roomNo}</p>
            <p>bedNo: {bed.bedNo}</p>
            <p>bedStatus: {bed.bedStatus}</p>
           
            </div>
}

        </div>
    );
}
export default BedStatusDetail;
