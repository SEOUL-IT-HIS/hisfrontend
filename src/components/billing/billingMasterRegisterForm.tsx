"use client"

import type { AppDispatch, RootState } from "@/store/store";
import { registerBillingMasterRequest } from "@/features/billing/billingMaster/slice";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const billingMasterRegisterForm = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.billingMaster.createStatus);

  const [form, setForm] = useState({
      sourceServiceCode: "",
      feeCode : "",
      feeName: "",
      defaultPrice: "",
      categoryCode: "",
      insurance: "",
      insuranceTypeCode: "",
      effectiveFrom: "",
      effectiveTo: ""
      });
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({...form,[name]: value,});
  };
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch(registerBillingMasterRequest({
      sourceServiceCode: form.sourceServiceCode,
      feeCode: form.feeCode,
      feeName: form.feeName,
      defaultPrice: form.defaultPrice,
      categoryCode: form.categoryCode,
      insuranceTypeCode: form.insuranceTypeCode,
      effectiveFrom: form.effectiveFrom,
      effectiveTo: form.effectiveTo
    }));
  };

  return (
    <div>
      <h2>수납기준정보 등록</h2>

      <form onSubmit={onSubmit}>
        서비스 구분 코드 :
        <input name="sourceServiceCode"
        placeholder="서비스구분코드"
        value={form.sourceServiceCode}
        onChange={onChange}/><br/>

        수가 코드 :
        <input name="feeCode"
        placeholder="수가코드"
        value={form.feeCode}
        onChange={onChange}/><br/>
        수가 명칭 :
        <input name="feeName"
        placeholder="수가명칭"
        value={form.feeName}
        onChange={onChange}/><br/>
        기본 단가 :
        <input type="number"
        name="defaultPrice"
        placeholder="기본단가"
        value={form.defaultPrice}
        onChange={onChange}/><br/>
        분류 코드 :
        <input name="categoryCode"
        placeholder="분류코드"
        value={form.categoryCode}
        onChange={onChange}/><br/>
        급여/비급여 코드 :
        <input name="insuranceTypeCode"
        placeholder="급여/비급여코드"
        value={form.insuranceTypeCode}
        onChange={onChange}/><br/>
        적용 시작일:
        <input type="date"
        name="effectiveFrom"
        placeholder="적용 시작일"
        value={form.effectiveFrom}
        onChange={onChange} /><br/>
        적용 종료일:
        <input type="date"
        name="effectiveTo"
        placeholder="적용 종료일"
        value={form.effectiveTo}
        onChange={onChange} /><br/>
        <button type="submit" disabled={loading}>       
          {loading ? "등록중..." : "등록"}
        </button>
      </form>
      {error && <p style={{ color: "red" }}>에러: {error}</p>}
    </div>
  );
};

export default billingMasterRegisterForm;