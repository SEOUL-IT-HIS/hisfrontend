"use client";

import { useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { registerStorageLocationRequest } from "@/features/pharmacy/slice";
import { FormActions, FormField, Input, PageHeader, Panel } from "@/components/common";
import type { RootState } from "@/store/store";
import type { StorageLocationRegisterRequest } from "@/features/pharmacy/types";

const initialForm: StorageLocationRegisterRequest = {
  locationName: "",
};

export default function StorageLocationRegisterForm() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [form, setForm] = useState<StorageLocationRegisterRequest>(initialForm);
  const error = useSelector((state: RootState) => state.pharmacy.storageLocationRegisterError);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.locationName.trim()) return;
    dispatch(registerStorageLocationRequest(form));
    router.push("/pharmacy/receipt");
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <PageHeader
        title="Register Storage Location"
        description="Register a storage location so it can be selected when registering a receipt."
      />
      {error && <p className="text-sm text-rose-500">{error}</p>}
      <Panel className="max-w-md p-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Location Name" required>
            <Input
              type="text"
              placeholder="e.g. Pharmacy Warehouse A"
              value={form.locationName}
              onChange={(e) => setForm({ locationName: e.target.value })}
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
