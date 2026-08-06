"use client"

import { useRouter } from "next/navigation";
import { BillingDetail } from "@/features/billing/searchBillingDetail/types";

    const  billingDetailSearchList = ({ billingDetail }: { billingDetail: BillingDetail }) => {
    const router = useRouter();

    const onMove=()=>{
        router.push(`api/billing/detail/${billingDetail.billingId}`)
    } 

    return (
            <div>
            <p>환자 ID :  {billingDetail.billingId}</p>
            <p>환자명  : {billingDetail.patientName}</p>
            <p>전화번호 : {billingDetail.tel} </p>
            <p>주소: {billingDetail.addr} </p>
            <p>항목명: {billingDetail.itemName} </p>
            <p>단가: {billingDetail.price} </p>
            <button onClick={onMove}>
                    상세보기
                </button>
        </div>
    );
};

export default billingDetailSearchList;
