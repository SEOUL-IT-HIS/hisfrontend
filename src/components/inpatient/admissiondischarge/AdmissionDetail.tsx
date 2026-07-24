"use client"

import { changeStatusRequest, fetchAdmissionDetailRequest } from "@/features/inpatient/admissiondischarge/slice";
import { RootState } from "@/store/store";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const AdmissionDetail=()=>{
    const dispatch=useDispatch();
    const { admissionId }:{admissionId:string} = useParams();
    const [newStatus, setNewStatus] = useState("");
    const admission=useSelector((state:RootState)=>state.inpatient.admissiondischarge.detail);
    const {loading,error}=useSelector((state:RootState)=>state.inpatient.admissiondischarge.detailStatus);
    useEffect(()=>{
        if (!admissionId) return;
        dispatch(fetchAdmissionDetailRequest(admissionId));
    },[admissionId]);

    return(
        <div>
            { loading && <p>로딩중...</p> }
            { error && <p>{error}</p> }
            { !loading && admission &&             
            <div>
            <p>AdmissionId: {admission.admissionId}</p>
            <p>AdmissionDeptId: {admission.admissionDeptId}</p>
            <p>AdmissionRoute: {admission.admissionRoute}</p>
            <p>AdmissionDate: {admission.admissionDate}</p>
            <p>PatientId: {admission.patientId}</p>
            <p>DoctorId: {admission.doctorId}</p>
            <p>Status: {admission.status}</p>
            <p>CreatedAt: {admission.createdAt}</p>
            <p>UpdatedAt: {admission.updatedAt}</p>
            <div>
  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
    <option value="">상태 선택</option>
    <option value="요청">요청</option>
    <option value="승인">승인</option>
    <option value="배정완료">배정완료</option>
    <option value="취소">취소</option>
  </select>
  <button
    disabled={!newStatus}
    onClick={() => dispatch(changeStatusRequest({ admissionId, status: newStatus }))}
  >
    상태 변경
  </button>
</div>
            </div>
            }
        </div>
    );
}
export default AdmissionDetail;
