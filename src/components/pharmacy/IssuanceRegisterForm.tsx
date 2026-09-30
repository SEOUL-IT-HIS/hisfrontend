"use client";

import { useState, type FormEvent } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { registerIssuanceRequest } from "@/features/pharmacy/slice";
import { Button, FormField, Input, PageHeader, Panel } from "@/components/common";

export default function IssuanceRegisterForm() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [medicationId, setMedicationId] = useState("");
  const [quantity, setQuantity] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!medicationId || !quantity) return;

    dispatch(
      registerIssuanceRequest({
        medicationId,
        quantity: Number(quantity),
      })
    );
    router.push("/pharmacy/issuance/list");
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader title="Register Issuance" description="Enter a medication ID and quantity to register an issuance." />
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
              type="text"
              placeholder="Issue Qty"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </FormField>
          <div className="flex justify-end">
            <Button type="submit">Register</Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
