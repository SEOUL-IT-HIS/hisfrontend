"use client";

import { useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { registerControlledDrugIssuanceRequest } from "@/features/pharmacy/slice";
import { FormActions, FormField, Input, PageHeader, Panel } from "@/components/common";
import type { RootState } from "@/store/store";

/** 마약류 출고 관리 (HL2-14) — 출고 자체는 IssuanceRegisterForm과 같은 항목, 처리자/입회자만 더 받는다. */
export default function ControlledDrugIssuanceForm() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [medicationId, setMedicationId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [staffId, setStaffId] = useState("");
  const [witnessStaffIds, setWitnessStaffIds] = useState("");
  const error = useSelector(
    (state: RootState) => state.pharmacy.controlledDrugRegisterError
  );

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const witnesses = witnessStaffIds
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
    if (!medicationId || !quantity || !staffId || witnesses.length === 0) return;

    dispatch(
      registerControlledDrugIssuanceRequest({
        issuance: { medicationId, quantity: Number(quantity) },
        staffId,
        witnessStaffIds: witnesses,
      })
    );
    router.push("/pharmacy/controlled/records");
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader
        title="Controlled Drug Issuance"
        description="Register a controlled drug issuance with staff and witness information."
      />
      {error && <p className="text-sm text-rose-500">{error}</p>}
      <Panel className="max-w-md p-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Medication ID" required>
            <Input
              type="text"
              placeholder="Medication ID"
              value={medicationId}
              onChange={(e) => setMedicationId(e.target.value)}
            />
          </FormField>
          <FormField label="Issue Qty" required>
            <Input
              type="number"
              placeholder="Issue Qty"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </FormField>
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
