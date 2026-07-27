"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import type { AppDispatch, RootState } from "@/store/store";
import { registerBillingMasterRequest } from "@/features/billing/billingMaster/slice";

export default function BillingMasterRegisterForm() {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { createStatus, createSuccess } = useSelector((state: RootState) => state.billingMaster);
    
    const [form, setForm] = useState({
    sourceServiceCode: "",
    feeCode: "",
    feeName: "",
    defaultPrice: "",
    categoryCode: "",
    insuranceTypeCode: "",
    effectiveFrom: "",
    effectiveTo: "",});

    useEffect(() => {
        if (createSuccess) {
            router.push('/billing/master');
        }
    }, [createSuccess, router]);

     const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const onRegister = (e:React.FormEvent) => {
        e.preventDefault();
        dispatch(registerBillingMasterRequest(form));
    };

    return (
        <div>
            <h2>수납 기준등록</h2>
            <input placeholder="원천서비스코드" value={form.sourceServiceCode} onChange={onChange} />
            <input placeholder="항목코드" value={form.feeCode} onChange={onChange} />
            <input placeholder="항목명" value={form.feeName} onChange={onChange} />
            <input placeholder="기본가격" value={form.defaultPrice} onChange={onChange} />
            <input placeholder="분류코드" value={form.categoryCode} onChange={onChange} />
            <input placeholder="보험유형코드" value={form.insuranceTypeCode} onChange={onChange} />
            <input placeholder="유효시작일" value={form.effectiveFrom} onChange={onChange} />
            <input placeholder="유효종료일" value={form.effectiveTo} onChange={onChange} />

            {createStatus.error && <p>{createStatus.error}</p>}

            <button onClick={onRegister}>등록</button>
        </div>
    );
}
