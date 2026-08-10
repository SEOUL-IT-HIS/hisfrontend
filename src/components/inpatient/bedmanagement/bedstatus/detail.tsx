"use client"

import { fetchBedDetailRequest, selectBedDetail, selectBedDetailStatus } from "@/features/inpatient/bedmanagement/bedstatus/slice";
import type { AppDispatch } from "@/store/store";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

const BedStatusDetail=()=>{
    const dispatch=useDispatch<AppDispatch>();
    const { bedId }:{bedId:string} = useParams();
    const bed=useSelector(selectBedDetail);
    const {loading,error}=useSelector(selectBedDetailStatus);
    useEffect(()=>{
        if (!bedId) return;
        dispatch(fetchBedDetailRequest(bedId));
    },[bedId, dispatch]);

    return(
        <div>
            { loading && <p>로딩중...</p> }
            { error && <p>{error}</p> }
            { !loading && bed &&         
          
               
            <div>
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
