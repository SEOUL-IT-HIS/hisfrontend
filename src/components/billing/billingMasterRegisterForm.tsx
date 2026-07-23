"use client"

import type { AppDispatch, RootState } from "@/store/store";
import { registerBillingMasterRequest } from "@/features/billing/BillingMaster/slice";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const BillingMasterRegisterForm = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.billingMaster.createStatus);

  const [form, setForm] = useState({
      billingMasterId: "",
      sourceService: "",
      code : "",
      name: "",
      price: "",
      category: "",
      insurance: "",
      effectiveFrom: "",
      });
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({...form,[name]: value,});
  };
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch(registerBillingMasterRequest({
      billingMasterId: form.billingMasterId,
      sourceServiceCode: form.sourceService,
      feeCode: form.code,
      feeName: form.name,
      defaultPrice: form.price,
      categoryCode: form.category,
      insuranceTypeCode: form.insurance,
      effectiveFrom: form.effectiveFrom,
    }));
  };

  return (
    <div>
      <h2>수납기준정보 등록</h2>

      <form onSubmit={onSubmit}>
        수납 식별자:  <input name="billingMasterId" placeholder="수납ID"
                value={form.billingMasterId } onChange={onChange} /><br/>
        서비스 구분 코드 :  <input name="sourceService" placeholder="서비스구분코드"
                value={form.sourceService} onChange={onChange} /><br/>
        수기코드 :  <input name="code"  placeholder="수기코드"
                value={form.code}  onChange={onChange} /><br/>
        수기 명칭 :  <input name="name" placeholder="수기명칭"
                value={form.name} onChange={onChange} /><br/>
        기본 단가 :  <input name="price" placeholder="기본단가"
                value={form.price} onChange={onChange} /><br/>
        분류     :  <input name="category" placeholder="분류"
                value={form.category} onChange={onChange} /><br/>
        급여/비급여 :  <input name="insurance" placeholder="급여/비급여"
                value={form.insurance} onChange={onChange} /><br/>
        적용 시작일 :  <input type="date" name="effectiveFrom"
                value={form.effectiveFrom} onChange={onChange} /><br/>
        <button type="submit" disabled={loading}>
          {loading ? "등록중..." : "등록"}
        </button>
      </form>
      {error && <p style={{ color: "red" }}>에러: {error}</p>}
    </div>
  );
};

export default BillingMasterRegisterForm;