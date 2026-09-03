"use client"

import { admissionBillingDetailRequest } from "@/features/billing/searchBillingDetail/slice";
import { AppDispatch, RootState } from "@/store/store";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
const billingDetailAdmission = () => {
    const { billingAdmissionId } = useParams<{ billingAdmissionId : string }>();
    const dispatch = useDispatch<AppDispatch>();

    const { loading, error, detail } = useSelector((state: RootState) => ({
        loading: state.billingDetail.admissionDetailStatus.loading,
        error: state.billingDetail.admissionDetailStatus.error,
        detail: state.billingDetail.admissionDetail
    }), shallowEqual);
    
    useEffect(() => {
        if (!billingAdmissionId) return; 
        dispatch(admissionBillingDetailRequest(billingAdmissionId));}, [billingAdmissionId]);             
    
    
    return (
        <div>
            {loading && <p>Loading...</p>}
            {error && <p>{error}</p>}
            {!loading && detail && (
            <>
           <div>Admission Detail:</div>
           <div>Billing ID:</div>
           <div>Patient ID:</div>
           <div>Visit ID:</div>
           <div>Admission ID:</div>
           <div>Billing Detail ID:</div>
           <div>Billing Master ID:</div>
           <div>Source Service Code:</div>
           <div>Source Record ID:</div>
           <div>Quantity:</div>
           <div>Unit Price:</div>
           <div>Amount:</div>
           <div>Detail Status:</div>
           <div>Occurred At:</div>
           <div>Created At:</div>
           <div>Updated At:</div>
           <div>Fee Code:</div>
           <div>Item Name:</div>

           </>
            )}
        </div>
    );
};

export default billingDetailAdmission;