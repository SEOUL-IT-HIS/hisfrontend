"use client";

import { useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { registerSupplierRequest } from "@/features/pharmacy/slice";
import { FormActions, FormField, Input, PageHeader, Panel } from "@/components/common";
import type { RootState } from "@/store/store";
import type { SupplierRegisterRequest } from "@/features/pharmacy/types";

const initialForm: SupplierRegisterRequest = {
  supplierName: "",
  contactPhone: "",
};

export default function SupplierRegisterForm() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [form, setForm] = useState<SupplierRegisterRequest>(initialForm);
  const error = useSelector((state: RootState) => state.pharmacy.supplierRegisterError);

  const handleChange =
    (field: keyof SupplierRegisterRequest) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.supplierName.trim()) return;
    dispatch(registerSupplierRequest(form));
    router.push("/pharmacy/receipt");
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <PageHeader
        title="Register Supplier"
        description="Register a supplier so it can be selected when registering a receipt."
      />
      {error && <p className="text-sm text-rose-500">{error}</p>}
      <Panel className="max-w-md p-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Supplier Name" required>
            <Input
              type="text"
              placeholder="Supplier Name"
              value={form.supplierName}
              onChange={handleChange("supplierName")}
            />
          </FormField>
          <FormField label="Contact Phone">
            <Input
              type="text"
              placeholder="Contact Phone"
              value={form.contactPhone}
              onChange={handleChange("contactPhone")}
            />
          </FormField>
          <FormActions
            submitLabel="Register"
            cancelLabel="Cancel"
            onCancel={() => router.push("/pharmacy/receipt")}
          />
        </form>
      </Panel>
    </div>
  );
}
