"use client";

import { useState, type FormEvent } from "react";
import { useDispatch } from "react-redux";
import { registerDisposalRequest } from "@/features/pharmacy/slice";
import {
  Button,
  DataTable,
  FormField,
  Input,
  PageHeader,
  Panel,
} from "@/components/common";
import type { DataTableColumn } from "@/components/common";

type DisposalRow = {
  id: number;
  medicationId: string;
  quantity: string;
  reason: string;
};

const columns: DataTableColumn<DisposalRow>[] = [
  { key: "medicationId", header: "Medication ID", render: (row) => row.medicationId },
  { key: "quantity", header: "Disposal Qty", render: (row) => row.quantity },
  { key: "reason", header: "Disposal Reason", render: (row) => row.reason },
];

export default function DisposalRegisterForm() {
  const dispatch = useDispatch();
  const [medicationId, setMedicationId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [rows, setRows] = useState<DisposalRow[]>([]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!medicationId || !quantity || !reason) return;

    dispatch(
      registerDisposalRequest({
        medicationId,
        quantity: Number(quantity),
        reason,
      })
    );

    setRows([...rows, { id: Date.now(), medicationId, quantity, reason }]);
    setMedicationId("");
    setQuantity("");
    setReason("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader
        title="Disposal Management"
        description="Enter a medication ID, quantity, and reason to register a disposal."
      />
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
          <FormField label="Disposal Qty" required>
            <Input
              type="text"
              placeholder="Disposal Qty"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </FormField>
          <FormField label="Disposal Reason" required>
            <Input
              type="text"
              placeholder="Disposal Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </FormField>
          <div className="flex justify-end">
            <Button type="submit">Register</Button>
          </div>
        </form>
      </Panel>
      <Panel className="min-h-0 flex-1 p-4">
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          emptyMessage="No disposals registered yet."
        />
      </Panel>
    </div>
  );
}
