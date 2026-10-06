"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSupplierListRequest,
  registerSupplierRequest,
} from "@/features/pharmacy/slice";
import { DataTable, FormActions, FormField, Input, PageHeader, Panel } from "@/components/common";
import type { DataTableColumn } from "@/components/common";
import type { RootState } from "@/store/store";
import type { SupplierDto, SupplierRegisterRequest } from "@/features/pharmacy/types";

const initialForm: SupplierRegisterRequest = {
  supplierName: "",
  contactPhone: "",
};

const columns: DataTableColumn<SupplierDto>[] = [
  { key: "supplierName", header: "Supplier Name", render: (row) => row.supplierName },
  { key: "contactPhone", header: "Contact Phone", render: (row) => row.contactPhone ?? "-" },
];

/**
 * 공급처 등록 — 등록한 뒤 다른 화면으로 넘어가지 않고 이 화면에서 목록에 바로 추가된 것을 보며
 * 이어서 다음 공급처를 등록할 수 있다(기준정보는 한 번에 여러 건 넣는 경우가 많다).
 */
export default function SupplierRegisterForm() {
  const dispatch = useDispatch();
  const [form, setForm] = useState<SupplierRegisterRequest>(initialForm);
  const supplierList = useSelector((state: RootState) => state.pharmacy.supplierList);
  const listLoading = useSelector((state: RootState) => state.pharmacy.supplierLoading);
  const listError = useSelector((state: RootState) => state.pharmacy.supplierError);
  const registerLoading = useSelector((state: RootState) => state.pharmacy.supplierRegisterLoading);
  const registerError = useSelector((state: RootState) => state.pharmacy.supplierRegisterError);
  const wasRegistering = useRef(false);

  useEffect(() => {
    dispatch(fetchSupplierListRequest());
  }, [dispatch]);

  // 등록이 끝났고 에러가 없으면 입력칸을 비운다(saga가 목록도 다시 불러온다).
  useEffect(() => {
    if (wasRegistering.current && !registerLoading && !registerError) {
      setForm(initialForm);
    }
    wasRegistering.current = registerLoading;
  }, [registerLoading, registerError]);

  const handleChange =
    (field: keyof SupplierRegisterRequest) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.supplierName.trim()) return;
    dispatch(registerSupplierRequest(form));
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <PageHeader
        title="Suppliers"
        description="Register a supplier so it can be selected when registering a receipt."
      />
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <Panel className="p-5">
          {registerError && <p className="mb-3 text-sm text-rose-500">{registerError}</p>}
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
              loading={registerLoading}
              cancelLabel="Reset"
              onCancel={() => setForm(initialForm)}
            />
          </form>
        </Panel>
        <Panel className="p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Registered Suppliers</h3>
          <DataTable
            columns={columns}
            rows={supplierList}
            rowKey={(row) => row.supplierId}
            loading={listLoading}
            loadingMessage="Loading..."
            emptyMessage={listError ?? "No suppliers registered yet."}
          />
        </Panel>
      </div>
    </div>
  );
}
