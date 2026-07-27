"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import { searchBillingDetailRequest } from "@/features/billing/searchBillingDetail/slice";

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
            {billingDetails.map((detail) => (
                <div key={detail.billingDetailId}>
                    <p>환자명: {detail.patientName}</p>
                    <p>전화번호: {detail.tel}</p>
                    <p>주소: {detail.addr}</p>
                    <p>진료비 항목: {detail.itemName}</p>
                    <p>금액: {detail.price}</p>
                </div>
            ))}
        </div>
    );
}
