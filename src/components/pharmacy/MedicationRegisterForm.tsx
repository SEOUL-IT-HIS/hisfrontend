"use client";

import { useState, type FormEvent } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { registerMedicationRequest } from "@/features/pharmacy/slice";
import { FormActions, FormField, Input, PageHeader, Panel } from "@/components/common";
import type { MedicationRegisterRequest } from "@/features/pharmacy/types";

const initialForm: MedicationRegisterRequest = {
  medicationName: "",
  itemSeq: "",
  itemEngName: "",
  entpName: "",
  etcOtcName: "",
  classNo: "",
  className: "",
  formCodeName: "",
  chart: "",
  itemPermitDate: "",
  ediCode: "",
  stdCd: "",
};

export default function MedicationRegisterForm() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [form, setForm] = useState<MedicationRegisterRequest>(initialForm);

  const handleChange =
    (field: keyof MedicationRegisterRequest) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.medicationName.trim()) {
      return;
    }
    // itemPermitDate는 LocalDate라 빈 문자열("")을 그대로 보내면 백엔드 파싱이 깨진다.
    // 비어있으면 필드 자체를 빼고 보낸다.
    dispatch(
      registerMedicationRequest({
        ...form,
        itemPermitDate: form.itemPermitDate || undefined,
      })
    );
    router.push("/pharmacy/list");
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <PageHeader
        title="약품 등록"
        description="공공API(의약품 낱알식별정보) 항목 기준으로 약품을 등록합니다."
      />
      <Panel className="max-w-xl p-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="제품명" required>
            <Input
              type="text"
              placeholder="제품명"
              value={form.medicationName}
              onChange={handleChange("medicationName")}
            />
          </FormField>
          <FormField label="품목기준코드">
            <Input
              type="text"
              placeholder="품목기준코드"
              value={form.itemSeq}
              onChange={handleChange("itemSeq")}
            />
          </FormField>
          <FormField label="제품영문명">
            <Input
              type="text"
              placeholder="제품영문명"
              value={form.itemEngName}
              onChange={handleChange("itemEngName")}
            />
          </FormField>
          <FormField label="업체명">
            <Input
              type="text"
              placeholder="업체명"
              value={form.entpName}
              onChange={handleChange("entpName")}
            />
          </FormField>
          <FormField label="전문/일반구분">
            <Input
              type="text"
              placeholder="예: 전문의약품"
              value={form.etcOtcName}
              onChange={handleChange("etcOtcName")}
            />
          </FormField>
          <FormField label="분류번호">
            <Input
              type="text"
              placeholder="분류번호"
              value={form.classNo}
              onChange={handleChange("classNo")}
            />
          </FormField>
          <FormField label="분류명">
            <Input
              type="text"
              placeholder="분류명"
              value={form.className}
              onChange={handleChange("className")}
            />
          </FormField>
          <FormField label="제형">
            <Input
              type="text"
              placeholder="예: 정제"
              value={form.formCodeName}
              onChange={handleChange("formCodeName")}
            />
          </FormField>
          <FormField label="성상">
            <Input
              type="text"
              placeholder="성상"
              value={form.chart}
              onChange={handleChange("chart")}
            />
          </FormField>
          <FormField label="허가일자">
            <Input
              type="date"
              value={form.itemPermitDate}
              onChange={handleChange("itemPermitDate")}
            />
          </FormField>
          <FormField label="EDI코드">
            <Input
              type="text"
              placeholder="EDI코드"
              value={form.ediCode}
              onChange={handleChange("ediCode")}
            />
          </FormField>
          <FormField label="표준코드">
            <Input
              type="text"
              placeholder="표준코드"
              value={form.stdCd}
              onChange={handleChange("stdCd")}
            />
          </FormField>
          <FormActions
            submitLabel="등록"
            onCancel={() => router.push("/pharmacy/list")}
          />
        </form>
      </Panel>
    </div>
  );
}
