"use client";

import { useState, type FormEvent } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { registerIssuanceRequest } from "@/features/pharmacy/slice";
import { Button, FormField, Input, PageHeader, Panel } from "@/components/common";
import MedicationSearchInput from "@/components/pharmacy/MedicationSearchInput";
import { useActor } from "@/features/pharmacy/useActor";

export default function IssuanceRegisterForm() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { actorId, actorName } = useActor();
  const [medicationId, setMedicationId] = useState("");
  const [quantity, setQuantity] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!medicationId || !quantity || !actorId) return;

    dispatch(
      registerIssuanceRequest({
        medicationId,
        quantity: Number(quantity),
        issuedById: actorId,
      })
    );
    router.push("/pharmacy/issuance/list");
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <PageHeader title="Register Issuance" description="Enter a medication ID and quantity to register an issuance." />
      <Panel className="max-w-md p-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Medication" required>
            <MedicationSearchInput value={medicationId} onChange={setMedicationId} />
          </FormField>
          <FormField label="Issue Qty" required>
            <Input
              type="number"
              placeholder="Issue Qty"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </FormField>
          <p className="text-xs text-slate-400">Issued by: {actorName || "-"} (signed-in user)</p>
          <div className="flex justify-end">
            <Button type="submit" disabled={!actorId}>
              Register
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
