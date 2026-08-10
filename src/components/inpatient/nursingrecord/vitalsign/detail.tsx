"use client"

import { fetchVitalSignDetailRequest } from "@/features/inpatient/nursingrecord/vitalsign/slice";
import { RootState } from "@/store/store";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

const VitalSignDetail=()=>{
    const dispatch=useDispatch();
    const { vitalSignId: vitalSignIdParam }:{vitalSignId:string} = useParams();
    const vitalSignId = vitalSignIdParam;
    const vitalSign=useSelector((state:RootState)=>state.inpatient.vitalsign.detail);
    const updateStatus = useSelector((state: RootState) => state.inpatient.vitalsign.updateStatus);
    const {loading,error}=useSelector((state:RootState)=>state.inpatient.vitalsign.detailStatus);
    useEffect(()=>{
        if (!vitalSignId) return;
        dispatch(fetchVitalSignDetailRequest(vitalSignId));
    },[vitalSignId]);

    useEffect(() => {
        if (updateStatus.success && vitalSignId) {
            dispatch(fetchVitalSignDetailRequest(vitalSignId));
        }
    }, [updateStatus.success, vitalSignId]);

    
    return(
        <div>
            { loading && <p>로딩중...</p> }
            { error && <p>{error}</p> }
            { !loading && vitalSign &&         
          
               
            <div>
            <p>VitalSignId: {vitalSign.vitalSignId}</p>
            <p>AdmissionId: {vitalSign.admissionId}</p>
            <p>MeasuredAt: {new Date(vitalSign.measuredAt).toLocaleString()}</p>
            <p>Temperature: {vitalSign.temperature}</p>
            <p>Pulse: {vitalSign.pulse}</p>
            <p>Respiration: {vitalSign.respiration}</p>
            <p>BpSystolic: {vitalSign.bpSystolic}</p>
            <p>BpDiastolic: {vitalSign.bpDiastolic}</p>
            <p>Spo2: {vitalSign.spo2}</p>
            <p>RecorderId: {vitalSign.recorderId}</p>
            <p>CreatedAt: {new Date(vitalSign.createdAt).toLocaleString()}</p>
            <p>UpdatedAt: {new Date(vitalSign.updatedAt).toLocaleString()}</p>
            </div>
}

        </div>
    );
}
export default VitalSignDetail;
