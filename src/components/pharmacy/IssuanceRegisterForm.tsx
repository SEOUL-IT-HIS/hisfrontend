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
      <PageHeader title="약품 출고 등록" description="약품ID와 수량을 입력해 출고를 등록합니다." />
      <Panel className="max-w-md p-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="약품ID" required>
            <Input
              type="text"
              placeholder="약품ID"
              value={medicationId}
              onChange={(e) => setMedicationId(e.target.value)}
            />
          </FormField>
          <FormField label="출고수량" required>
            <Input
              type="text"
              placeholder="출고수량"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </FormField>
          <div className="flex justify-end">
            <Button type="submit">출고</Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
