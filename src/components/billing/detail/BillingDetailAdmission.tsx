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
            {loading && <p>로딩중...</p>}
            {error && <p>{error}</p>}
            {!loading && detail && (
            <>
           <div>입퇴원 상세 조회 :</div>
           <div>수납ID :</div>
           <div>환자ID :</div>
           <div>방문ID :</div>
           <div>입원ID :</div>
           <div>수납상세ID :</div>
           <div>수납기준ID :</div>
           <div>서비스 구분 코드 :</div>
           <div>원본 레코드 ID :</div>
           <div>수량 :</div>
           <div>단가 :</div>
           <div>금액 :</div>
           <div>수납상태 :</div>
           <div>발생시점 :</div>
           <div>등록일시 :</div>
           <div>수정일시 :</div>
           <div>수기코드 :</div>
           <div>항목명 :</div>

           </>
            )}
        </div>
    );
};

export default billingDetailAdmission;