"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import { searchBillingDetailRequest } from "@/features/billing/searchBillingDetail/slice";
import BillingDetailSearchList from "@/components/billing/BillingDetailSearchList";

export default function BillingDetailSearchForm() {
    const dispatch = useDispatch<AppDispatch>();
    const [patientName, setPatientName] = useState("");
    const { billingDetails, loading, error } = useSelector(
        (state: RootState) => state.billingDetail,
    );

    const onSearch = () => {
        dispatch(searchBillingDetailRequest({ patientName }));
    };

    return (
        <div>
            <input type="text" value={patientName}
                   placeholder="환자명을 입력하세요"
                   onChange={(event) => setPatientName(event.target.value)} />
            <button onClick={onSearch}>환자 검색</button>

            {loading && <p>조회 중입니다.</p>}
            {error && <p>{error}</p>}
            {!loading && !error && billingDetails.length === 0 && (<p>검색 결과가 없습니다.</p>)}
            
            <div>
                {billingDetails.map((billingDetail)=>(
                    <BillingDetailSearchList key={billingDetail.billingId}
                    billingDetail={billingDetail}
                    />
                    ))}
            </div>


        </div>
    );
}
