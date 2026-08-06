"use client"

import { fetchBillingDetailRequest } from "@/features/billing/searchBillingDetail/slice";
import { AppDispatch, RootState } from "@/store/store";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
const billingDetailSearchDetail = () => {
    const { billingDetailId } = useParams<{ billingDetailId : string }>();
    const dispatch = useDispatch<AppDispatch>();

    const { loading, error, detail } = useSelector((state: RootState) => ({
        loading: state.billingDetail.detailStatus.loading,
        error: state.billingDetail.detailStatus.error,
        detail: state.billingDetail.detail
    }), shallowEqual);
    
    useEffect(() => {
        if (!billingDetailId) return; 
        dispatch(fetchBillingDetailRequest(billingDetailId));}, [billingDetailId]);             
    
    
    return (
        <div>
            {loading && <p>로딩중...</p>}
            {error && <p>{error}</p>}
            {!loading && detail && (
            <>
            <div>환자 정보 </div>
           <div>환자명: {detail.patientName}</div>
           <div>성별 :{detail.gender}</div>
           <div>주소 :{detail.addr}</div>
           <div>전화번호 {detail.tel}</div>
           </>
            )}
        </div>
    );
};

export default billingDetailSearchDetail;