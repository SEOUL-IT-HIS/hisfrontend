"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { registerBillingMasterRequest } from "@/features/billing/billingMaster/slice";
import { Alert, FormActions, FormField, Input, Panel } from "@/components/common";
import type { AppDispatch, RootState } from "@/store/store";

type BillingMasterFormState = {
  sourceServiceCode: string;
  feeCode: string;
  feeName: string;
  defaultPrice: string;
  categoryCode: string;
  insuranceTypeCode: string;
  effectiveFrom: string;
  effectiveTo: string;
};

const initialForm: BillingMasterFormState = {
  sourceServiceCode: "",
  feeCode: "",
  feeName: "",
  defaultPrice: "",
  categoryCode: "",
  insuranceTypeCode: "",
  effectiveFrom: "",
  effectiveTo: "",
};

const BillingMasterRegisterForm = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.billingMaster.createStatus);

  const [form, setForm] = useState<BillingMasterFormState>(initialForm);

  /** true 이면 "이번 제출"에 대한 결과를 기다리는 중 — 재방문 시 남아있는 이전 상태로 오작동 방지 */
  const waitResult = useRef(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    waitResult.current = true;
    dispatch(registerBillingMasterRequest(form));
  };

  // 등록 결과 반영: 실패면 에러만 보여주고 폼 유지, 성공이면 목록으로 이동
  // (성공 피드백이 없으면 사용자가 재클릭해 같은 값으로 중복 등록을 시도하게 된다)
  useEffect(() => {
    if (!waitResult.current) return;
    if (loading) return;
    if (error) {
      waitResult.current = false;
      return;
    }
    waitResult.current = false;
    router.push("/billing/statistics");
  }, [loading, error, router]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-sky-600">BILLING</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">수납 기준정보 등록</h1>
          <p className="mt-1 text-sm text-slate-500">새로운 수가 기준정보를 등록합니다.</p>
        </div>
      </header>

      <Panel>
        <form onSubmit={onSubmit} className="flex flex-col gap-4 px-5 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="서비스 구분 코드" required htmlFor="sourceServiceCode">
              <Input
                id="sourceServiceCode"
                name="sourceServiceCode"
                placeholder="서비스구분코드"
                value={form.sourceServiceCode}
                onChange={onChange}
                required
              />
            </FormField>

            <FormField label="수가 코드" required htmlFor="feeCode">
              <Input
                id="feeCode"
                name="feeCode"
                placeholder="수가코드"
                value={form.feeCode}
                onChange={onChange}
                required
              />
            </FormField>

            <FormField label="수가 명칭" required htmlFor="feeName">
              <Input
                id="feeName"
                name="feeName"
                placeholder="수가명칭"
                value={form.feeName}
                onChange={onChange}
                required
              />
            </FormField>

            <FormField label="기본 단가" required htmlFor="defaultPrice">
              <Input
                id="defaultPrice"
                name="defaultPrice"
                type="number"
                placeholder="기본단가"
                value={form.defaultPrice}
                onChange={onChange}
                required
              />
            </FormField>

            <FormField label="분류 코드" required htmlFor="categoryCode">
              <Input
                id="categoryCode"
                name="categoryCode"
                placeholder="분류코드"
                value={form.categoryCode}
                onChange={onChange}
                required
              />
            </FormField>

            <FormField label="급여/비급여 코드" required htmlFor="insuranceTypeCode">
              <Input
                id="insuranceTypeCode"
                name="insuranceTypeCode"
                placeholder="급여/비급여코드"
                value={form.insuranceTypeCode}
                onChange={onChange}
                required
              />
            </FormField>

            <FormField label="적용 시작일" required htmlFor="effectiveFrom">
              <Input
                id="effectiveFrom"
                name="effectiveFrom"
                type="date"
                value={form.effectiveFrom}
                onChange={onChange}
                required
              />
            </FormField>

            <FormField label="적용 종료일" required htmlFor="effectiveTo">
              <Input
                id="effectiveTo"
                name="effectiveTo"
                type="date"
                value={form.effectiveTo}
                onChange={onChange}
                required
              />
            </FormField>
          </div>

          {error ? <Alert variant="error">{error}</Alert> : null}

          <FormActions
            onCancel={() => router.push("/billing/statistics")}
            submitLabel="등록"
            loading={loading}
            loadingLabel="등록 중..."
          />
        </form>
      </Panel>
    </div>
  );
};

export default BillingMasterRegisterForm;
