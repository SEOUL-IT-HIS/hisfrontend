"use client"

import { fetchBillingMasterDetailRequest } from "@/features/billing/billingMaster/slice";
import { AppDispatch, RootState } from "@/store/store";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
const Detail = () => {
    const { billingId } = useParams<{ billingId : string }>();
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter(); 

    const { loading, error, detail } = useSelector((state: RootState) => ({
        loading: state.billingMaster.detailStatus.loading,
        error: state.billingMaster.detailStatus.error,
        detail: state.billingMaster.detail
    }), shallowEqual);
    
    useEffect(() => {
        if (!billingId) return; 
        dispatch(fetchBillingMasterDetailRequest(billingId));}, [billingId]);             
    
    
    return (
        <div>
            {loading && <p>로딩중...</p>}
            {error && <p>{error}</p>}
            {!loading && detail && (
            <>
            <div>{detail.feeCode}</div>
            <div>{detail.feeName}</div>
           <div>{detail.defaultPrice}</div>
           <div>{detail.useYn}</div>
           <div>{detail.effectiveTo}</div>
           </>
            )}
        </div>
    );
};

export default Detail;