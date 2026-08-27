"use client";

import { useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { registerReceiptRequest } from "@/features/pharmacy/slice";
import { FormActions, FormField, Input, PageHeader, Panel } from "@/components/common";
import type { RootState } from "@/store/store";
import type { ReceiptRegisterRequest } from "@/features/pharmacy/types";

const initialForm: ReceiptRegisterRequest = {
  supplierId: "",
  storageLocationId: "",
  receiptDt: "",
  receivedById: "",
  items: [
    {
      medicationId: "",
      lotNo: "",
      expirationDt: "",
      manufactureDt: "",
      unitCd: "",
      receiptQty: 0,
      unitPrice: 0,
    },
  ],
};

export default function ReceiptRegisterForm() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [form, setForm] = useState<ReceiptRegisterRequest>(initialForm);
  const error = useSelector(
    (state: RootState) => state.pharmacy.receiptRegisterError
  );

  const item = form.items[0];

  const handleFieldChange =
    (field: keyof Omit<ReceiptRegisterRequest, "items">) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleItemChange =
    (field: keyof ReceiptRegisterRequest["items"][number]) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        field === "receiptQty" || field === "unitPrice"
          ? Number(e.target.value)
          : e.target.value;
      setForm((prev) => ({
        ...prev,
        items: [{ ...prev.items[0], [field]: value }],
      }));
    };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      !form.supplierId ||
      !form.storageLocationId ||
      !form.receiptDt ||
      !form.receivedById ||
      !item.medicationId ||
      !item.lotNo ||
      !item.expirationDt ||
      !item.unitCd ||
      !item.receiptQty
    ) {
      return;
    }
    // manufactureDt는 LocalDate라 빈 문자열("")을 그대로 보내면 백엔드 파싱이 깨진다.
    // 비어있으면 필드 자체를 빼고 보낸다.
    dispatch(
      registerReceiptRequest({
        ...form,
        items: [{ ...item, manufactureDt: item.manufactureDt || undefined }],
      })
    );
    router.push("/pharmacy/receipt/list");
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <PageHeader title="약품 입고 등록" description="입고 정보와 약품 항목을 입력해 입고를 등록합니다." />
      {error && (
        <p className="text-sm text-rose-500">{error}</p>
      )}
      <Panel className="max-w-xl p-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="text-xs font-semibold text-slate-400">입고 정보</p>
          <FormField label="공급업체ID" required>
            <Input
              type="text"
              placeholder="공급업체ID"
              value={form.supplierId}
              onChange={handleFieldChange("supplierId")}
            />
          </FormField>
          <FormField label="보관위치ID" required>
            <Input
              type="text"
              placeholder="보관위치ID"
              value={form.storageLocationId}
              onChange={handleFieldChange("storageLocationId")}
            />
          </FormField>
          <FormField label="입고일자" required>
            <Input
              type="date"
              value={form.receiptDt}
              onChange={handleFieldChange("receiptDt")}
            />
          </FormField>
          <FormField label="담당자ID" required>
            <Input
              type="text"
              placeholder="담당자ID"
              value={form.receivedById}
              onChange={handleFieldChange("receivedById")}
            />
          </FormField>

          <p className="mt-2 text-xs font-semibold text-slate-400">약품 항목</p>
          <FormField label="약품ID" required>
            <Input
              type="text"
              placeholder="약품ID"
              value={item.medicationId}
              onChange={handleItemChange("medicationId")}
            />
          </FormField>
          <FormField label="로트번호" required>
            <Input
              type="text"
              placeholder="로트번호"
              value={item.lotNo}
              onChange={handleItemChange("lotNo")}
            />
          </FormField>
          <FormField label="유효기간" required>
            <Input
              type="date"
              value={item.expirationDt}
              onChange={handleItemChange("expirationDt")}
            />
          </FormField>
          <FormField label="제조일자">
            <Input
              type="date"
              value={item.manufactureDt}
              onChange={handleItemChange("manufactureDt")}
            />
          </FormField>
          <FormField label="단위코드" required>
            <Input
              type="text"
              placeholder="예: EA"
              value={item.unitCd}
              onChange={handleItemChange("unitCd")}
            />
          </FormField>
          <FormField label="입고수량" required>
            <Input
              type="number"
              placeholder="입고수량"
              value={item.receiptQty}
              onChange={handleItemChange("receiptQty")}
            />
          </FormField>
          <FormField label="단가">
            <Input
              type="number"
              placeholder="단가"
              value={item.unitPrice}
              onChange={handleItemChange("unitPrice")}
            />
          </FormField>

          <FormActions
            submitLabel="입고"
            onCancel={() => router.push("/pharmacy/receipt/list")}
          />
        </form>
      </Panel>
    </div>
  );
}
