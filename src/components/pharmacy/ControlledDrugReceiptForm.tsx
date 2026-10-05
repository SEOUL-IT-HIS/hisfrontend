"use client";

import { useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { registerControlledDrugReceiptRequest } from "@/features/pharmacy/slice";
import { FormActions, FormField, Input, PageHeader, Panel } from "@/components/common";
import type { RootState } from "@/store/store";
import type { ReceiptRegisterRequest } from "@/features/pharmacy/types";

const initialReceipt: ReceiptRegisterRequest = {
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

/** 마약류 입고 관리 (HL2-12) — 입고 자체는 ReceiptRegisterForm과 같은 항목, 처리자/입회자만 더 받는다. */
export default function ControlledDrugReceiptForm() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [receipt, setReceipt] = useState<ReceiptRegisterRequest>(initialReceipt);
  const [staffId, setStaffId] = useState("");
  const [witnessStaffIds, setWitnessStaffIds] = useState("");
  const error = useSelector(
    (state: RootState) => state.pharmacy.controlledDrugRegisterError
  );

  const item = receipt.items[0];

  const handleReceiptFieldChange =
    (field: keyof Omit<ReceiptRegisterRequest, "items">) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setReceipt((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleItemChange =
    (field: keyof ReceiptRegisterRequest["items"][number]) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        field === "receiptQty" || field === "unitPrice"
          ? Number(e.target.value)
          : e.target.value;
      setReceipt((prev) => ({
        ...prev,
        items: [{ ...prev.items[0], [field]: value }],
      }));
    };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const witnesses = witnessStaffIds
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
    if (
      !receipt.supplierId ||
      !receipt.storageLocationId ||
      !receipt.receiptDt ||
      !receipt.receivedById ||
      !item.medicationId ||
      !item.lotNo ||
      !item.expirationDt ||
      !item.unitCd ||
      !item.receiptQty ||
      !staffId ||
      witnesses.length === 0
    ) {
      return;
    }
    dispatch(
      registerControlledDrugReceiptRequest({
        receipt: {
          ...receipt,
          items: [{ ...item, manufactureDt: item.manufactureDt || undefined }],
        },
        staffId,
        witnessStaffIds: witnesses,
      })
    );
    router.push("/pharmacy/controlled/records");
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <PageHeader
        title="Controlled Drug Receipt"
        description="Register a controlled drug receipt with staff and witness information."
      />
      {error && <p className="text-sm text-rose-500">{error}</p>}
      <Panel className="max-w-xl p-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="text-xs font-semibold text-slate-400">Receipt Info</p>
          <FormField label="Supplier ID" required>
            <Input
              type="text"
              placeholder="Supplier ID"
              value={receipt.supplierId}
              onChange={handleReceiptFieldChange("supplierId")}
            />
          </FormField>
          <FormField label="Storage Location ID" required>
            <Input
              type="text"
              placeholder="Storage Location ID"
              value={receipt.storageLocationId}
              onChange={handleReceiptFieldChange("storageLocationId")}
            />
          </FormField>
          <FormField label="Receipt Date" required>
            <Input
              type="date"
              value={receipt.receiptDt}
              onChange={handleReceiptFieldChange("receiptDt")}
            />
          </FormField>
          <FormField label="Handler ID" required>
            <Input
              type="text"
              placeholder="Handler ID"
              value={receipt.receivedById}
              onChange={handleReceiptFieldChange("receivedById")}
            />
          </FormField>

          <p className="mt-2 text-xs font-semibold text-slate-400">Medication Item</p>
          <FormField label="Medication ID" required>
            <Input
              type="text"
              placeholder="Medication ID"
              value={item.medicationId}
              onChange={handleItemChange("medicationId")}
            />
          </FormField>
          <FormField label="Lot No." required>
            <Input
              type="text"
              placeholder="Lot No."
              value={item.lotNo}
              onChange={handleItemChange("lotNo")}
            />
          </FormField>
          <FormField label="Expiration Date" required>
            <Input
              type="date"
              value={item.expirationDt}
              onChange={handleItemChange("expirationDt")}
            />
          </FormField>
          <FormField label="Manufacture Date">
            <Input
              type="date"
              value={item.manufactureDt}
              onChange={handleItemChange("manufactureDt")}
            />
          </FormField>
          <FormField label="Unit Code" required>
            <Input
              type="text"
              placeholder="e.g. EA"
              value={item.unitCd}
              onChange={handleItemChange("unitCd")}
            />
          </FormField>
          <FormField label="Receipt Qty" required>
            <Input
              type="number"
              placeholder="Receipt Qty"
              value={item.receiptQty}
              onChange={handleItemChange("receiptQty")}
            />
          </FormField>
          <FormField label="Unit Price">
            <Input
              type="number"
              placeholder="Unit Price"
              value={item.unitPrice}
              onChange={handleItemChange("unitPrice")}
            />
          </FormField>

          <p className="mt-2 text-xs font-semibold text-slate-400">Staff / Witnesses</p>
          <FormField label="Staff ID" required hint="The pharmacist handling this transaction.">
            <Input
              type="text"
              placeholder="Staff ID"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
            />
          </FormField>
          <FormField
            label="Witness Staff IDs"
            required
            hint="At least one witness is required by law. Separate multiple IDs with commas."
          >
            <Input
              type="text"
              placeholder="e.g. NURSE-001, NURSE-002"
              value={witnessStaffIds}
              onChange={(e) => setWitnessStaffIds(e.target.value)}
            />
          </FormField>

          <FormActions
            submitLabel="Register"
            cancelLabel="Cancel"
            onCancel={() => router.push("/pharmacy/controlled")}
          />
        </form>
      </Panel>
    </div>
  );
}
