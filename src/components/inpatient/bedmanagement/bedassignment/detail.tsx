"use client"

import { fetchAdmissionDetailRequest } from "@/features/inpatient/admissiondischarge/slice";
import { fetchBedAssignmentDetailRequest, updateBedAssignmentRequest, selectBedAssignmentUpdateStatus } from "@/features/inpatient/bedmanagement/bedassignment/slice";
import { fetchPatientDetailRequest } from "@/features/patient/slice/patientSlice";
import { RootState } from "@/store/store";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

const BedAssignmentDetail=()=>{
    const dispatch=useDispatch();
    const { assignmentId: assignmentIdParam }:{assignmentId:string} = useParams();
    const assignmentId = Number(assignmentIdParam);
    const bedAssignment=useSelector((state:RootState)=>state.inpatient.bedmanagement.detail);
    const updateStatus = useSelector((state: RootState) => state.inpatient.bedmanagement.updateStatus);
    const {loading,error}=useSelector((state:RootState)=>state.inpatient.bedmanagement.detailStatus);
    const admission = useSelector((state: RootState) => state.inpatient.admissiondischarge.detail);
    const patientDetail = useSelector((state: RootState) => state.patient.patientDetail);


    useEffect(() => {
    if (!bedAssignment?.admissionId) return;
    dispatch(fetchAdmissionDetailRequest(bedAssignment.admissionId));
    }, [bedAssignment?.admissionId]);

    useEffect(() => {
    if (!admission?.patientId) return;
    dispatch(fetchPatientDetailRequest(admission.patientId));
    }, [admission?.patientId]);


    useEffect(() => {
        if (!bedAssignment?.admissionId) return;
        dispatch(fetchAdmissionDetailRequest(bedAssignment.admissionId));
    }, [bedAssignment?.admissionId]);

    useEffect(()=>{
        if (!assignmentId) return;
        dispatch(fetchBedAssignmentDetailRequest(assignmentId));
    },[assignmentId]);

    useEffect(() => {
        if (updateStatus.success && assignmentId) {
            dispatch(fetchBedAssignmentDetailRequest(assignmentId));
        }
    }, [updateStatus.success, assignmentId]);

    const handleRelease = () => {
        if (!bedAssignment) return;
        dispatch(updateBedAssignmentRequest({ ...bedAssignment, 
            releasedAt: new Date().toISOString().slice(0, -1) }));
    };
    return(
        <div>
            { loading && <p>로딩중...</p> }
            { error && <p>{error}</p> }
            { !loading && bedAssignment &&         
          
               
            <div>
            <p>환자명:{
                admission?.admissionId === bedAssignment.admissionId
                ?(patientDetail?.patientId === admission.patientId?patientDetail.patientName:"Patient Not Found")
                : "Admission Not Found"
            }</p>
            <p>AssignmentId: {bedAssignment.assignmentId}</p>
            <p>BedId: {bedAssignment.bedId}</p>
            <p>AdmissionId: {bedAssignment.admissionId}</p>
            <p>AssignedAt: {bedAssignment.assignedAt}</p>
            <p>ReleasedAt: {bedAssignment.releasedAt ?? "-"}</p>
            {bedAssignment.releasedAt === null && (
                <button onClick={handleRelease} disabled={updateStatus.loading}>
                    {updateStatus.loading ? "처리중..." : "퇴상처리"}
                </button>
            )}
            {updateStatus.error && <p>{updateStatus.error}</p>}
            {updateStatus.success && <p>퇴상처리 완료</p>}
            <p>CreatedAt: {bedAssignment.createdAt}</p>
            <p>UpdatedAt: {bedAssignment.updatedAt}</p>
            </div>
}

        </div>
    );
}
export default BedAssignmentDetail;
