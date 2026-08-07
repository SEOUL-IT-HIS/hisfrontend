"use client"

import { visitBillingDetailRequest } from "@/features/billing/searchBillingDetail/slice";
import { AppDispatch, RootState } from "@/store/store";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
const billingDetailVisit = () => {
    const { billingVisitId } = useParams<{ billingVisitId : string }>();
    const dispatch = useDispatch<AppDispatch>();

    const { loading, error, visitDetail } = useSelector((state: RootState) => ({
        loading: state.visitDetail.visitDetailStatus.loading,
        error: state.visitDetail.visitDetailStatus.error,
        visitDetail: state.visitDetail.visitDetail
    }), shallowEqual);
    
    useEffect(() => {
        if (!billingVisitId) return; 
        dispatch(visitBillingDetailRequest(billingVisitId));}, [billingVisitId]);             
    
    
    return (
        <div>
            {loading && <p>로딩중...</p>}
            {error && <p>{error}</p>}
            {!loading && visitDetail && (
            <>
           <div>입퇴원 상세 조회</div>
           <div>수납ID {visitDetail.billingId}:</div>
           <div>환자ID {visitDetail.patientId}:</div>
           <div>방문ID {visitDetail.visitId}:</div>
           <div>입원ID {visitDetail.admissionId}:</div>
           <div>수납상세ID {visitDetail.billingDetailId}:</div>
           <div>수납기준ID {visitDetail.billingMasterId}:</div>
           <div>서비스 구분 코드 {visitDetail.sourceServiceCode}:</div>
           <div>원본 레코드 ID {visitDetail.sourceRecordId}:</div>
           <div>수량 {visitDetail.quantity}:</div>
           <div>단가 {visitDetail.unitPrice}:</div>
           <div>금액 {visitDetail.amount}:</div>
           <div>수납상태 {visitDetail.billingStatus}:</div>
           <div>발생시점 {visitDetail.OccurredAt}:</div>
           <div>등록일시 {visitDetail.createdAt}:</div>
           <div>수정일시 {visitDetail.updatedAt}:</div>
           <div>수기코드 {visitDetail.feeCode}:</div>
           <div>항목명 {visitDetail.itemName}:</div>

           </>
            )}
        </div>
    );
};

export default billingDetailVisit;