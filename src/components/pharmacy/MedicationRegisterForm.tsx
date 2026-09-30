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
        title="Register Medication"
        description="Register a medication based on Public API (drug pill identification) fields."
      />
      <Panel className="max-w-xl p-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Product Name" required>
            <Input
              type="text"
              placeholder="Product Name"
              value={form.medicationName}
              onChange={handleChange("medicationName")}
            />
          </FormField>
          <FormField label="Item Seq">
            <Input
              type="text"
              placeholder="Item Seq"
              value={form.itemSeq}
              onChange={handleChange("itemSeq")}
            />
          </FormField>
          <FormField label="Product Eng. Name">
            <Input
              type="text"
              placeholder="Product Eng. Name"
              value={form.itemEngName}
              onChange={handleChange("itemEngName")}
            />
          </FormField>
          <FormField label="Company">
            <Input
              type="text"
              placeholder="Company"
              value={form.entpName}
              onChange={handleChange("entpName")}
            />
          </FormField>
          <FormField label="Rx/OTC Type">
            <Input
              type="text"
              placeholder="e.g. Prescription drug"
              value={form.etcOtcName}
              onChange={handleChange("etcOtcName")}
            />
          </FormField>
          <FormField label="Class No.">
            <Input
              type="text"
              placeholder="Class No."
              value={form.classNo}
              onChange={handleChange("classNo")}
            />
          </FormField>
          <FormField label="Class Name">
            <Input
              type="text"
              placeholder="Class Name"
              value={form.className}
              onChange={handleChange("className")}
            />
          </FormField>
          <FormField label="Form">
            <Input
              type="text"
              placeholder="e.g. Tablet"
              value={form.formCodeName}
              onChange={handleChange("formCodeName")}
            />
          </FormField>
          <FormField label="Appearance">
            <Input
              type="text"
              placeholder="Appearance"
              value={form.chart}
              onChange={handleChange("chart")}
            />
          </FormField>
          <FormField label="Permit Date">
            <Input
              type="date"
              value={form.itemPermitDate}
              onChange={handleChange("itemPermitDate")}
            />
          </FormField>
          <FormField label="EDI Code">
            <Input
              type="text"
              placeholder="EDI Code"
              value={form.ediCode}
              onChange={handleChange("ediCode")}
            />
          </FormField>
          <FormField label="Standard Code">
            <Input
              type="text"
              placeholder="Standard Code"
              value={form.stdCd}
              onChange={handleChange("stdCd")}
            />
          </FormField>
          <FormActions
            submitLabel="Register"
            cancelLabel="Cancel"
            onCancel={() => router.push("/pharmacy/list")}
          />
        </form>
      </Panel>
    </div>
  );
}
