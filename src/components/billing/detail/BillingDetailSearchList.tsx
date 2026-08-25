"use client"

import { useRouter } from "next/navigation";
import { SearchPatientResult } from "@/features/billing/searchBillingDetail/types";

    const  billingDetailSearchList = ({ patient }: { patient : SearchPatientResult }) => {
    const router = useRouter();

    const onDetail = () => {
        router.push(`/billing/detail/${patient.billingId}`)
    }

    
    return (
            <div>
            <p>환자 ID :  {patient.patientId}</p>
            <p>환자명  : {patient.patientName}</p>
            <p>전화번호 : {patient.tel} </p>
            <p>주소: {patient.addr} </p>
            <p>항목명: {patient.itemName} </p>
            <button onClick={onDetail}>
                    상세보기
                </button>
        </div>
    );
};

export default billingDetailSearchList;
