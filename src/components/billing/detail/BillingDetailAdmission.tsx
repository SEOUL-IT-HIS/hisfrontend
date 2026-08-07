"use client"

import { admissionBillingDetailRequest } from "@/features/billing/searchBillingDetail/slice";
import { AppDispatch, RootState } from "@/store/store";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
const billingDetailAdmission = () => {
    const { billingAdmissionId } = useParams<{ billingAdmissionId : string }>();
    const dispatch = useDispatch<AppDispatch>();

    const { loading, error, admissionDetail } = useSelector((state: RootState) => ({
        loading: state.admissionDetail.admissionDetailStatus.loading,
        error: state.admissionDetail.admissionDetailStatus.error,
        admissionDetail: state.admissionDetail.admissionDetail
    }), shallowEqual);
    
    useEffect(() => {
        if (!billingAdmissionId) return; 
        dispatch(admissionBillingDetailRequest(billingAdmissionId));}, [billingAdmissionId]);             
    
    
    return (
        <div>
            {loading && <p>로딩중...</p>}
            {error && <p>{error}</p>}
            {!loading && admissionDetail && (
            <>
           <div>입퇴원 상세 조회</div>
           <div>수납ID {admissionDetail.billingId}:</div>
           <div>환자ID {admissionDetail.patientId}:</div>
           <div>방문ID {admissionDetail.visitId}:</div>
           <div>입원ID {admissionDetail.admissionId}:</div>
           <div>수납상세ID {admissionDetail.billingDetailId}:</div>
           <div>수납기준ID {admissionDetail.billingMasterId}:</div>
           <div>서비스 구분 코드 {admissionDetail.sourceServiceCode}:</div>
           <div>원본 레코드 ID {admissionDetail.sourceRecordId}:</div>
           <div>수량 {admissionDetail.quantity}:</div>
           <div>단가 {admissionDetail.unitPrice}:</div>
           <div>금액 {admissionDetail.amount}:</div>
           <div>수납상태 {admissionDetail.billingStatus}:</div>
           <div>발생시점 {admissionDetail.OccurredAt}:</div>
           <div>등록일시 {admissionDetail.createdAt}:</div>
           <div>수정일시 {admissionDetail.updatedAt}:</div>
           <div>수기코드 {admissionDetail.feeCode}:</div>
           <div>항목명 {admissionDetail.itemName}:</div>

           </>
            )}
        </div>
    );
};

export default billingDetailAdmission;