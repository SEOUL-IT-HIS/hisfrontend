"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { registerReceiptRequest } from "@/features/pharmacy/slice";
import { FormActions, FormField, Input, PageHeader, Panel, Select } from "@/components/common";
import MedicationSearchInput from "@/components/pharmacy/MedicationSearchInput";
import SupplierSelect from "@/components/pharmacy/SupplierSelect";
import StorageLocationSelect from "@/components/pharmacy/StorageLocationSelect";
import type { RootState } from "@/store/store";
import type { ReceiptRegisterRequest } from "@/features/pharmacy/types";
import { fetchEmpApi } from "@/features/emp/api/empApi";
import type { Emp } from "@/features/emp/types/empTypes";

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

  // 입고 담당자는 자유 텍스트로 받지 않고 admin에 실제 등록된 직원만 고를 수 있게 한다.
  const [employees, setEmployees] = useState<Emp[]>([]);
  const [employeeLoadError, setEmployeeLoadError] = useState("");
  useEffect(() => {
    let ignore = false;
    fetchEmpApi()
      .then((list) => {
        if (!ignore) setEmployees(list);
      })
      .catch((err: unknown) => {
        if (!ignore) {
          setEmployeeLoadError(
            err instanceof Error ? err.message : "Failed to load the employee list."
          );
        }
      });
    return () => {
      ignore = true;
    };
  }, []);
  const employeeOptions = employees.map((employee) => ({
    value: employee.empId,
    label: `${employee.empName} (${employee.empNo})`,
  }));

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
      <PageHeader title="Register Receipt" description="Enter receipt details and a medication item to register a receipt." />
      {error && (
        <p className="text-sm text-rose-500">{error}</p>
      )}
      {employeeLoadError && <p className="text-sm text-rose-500">{employeeLoadError}</p>}
      <Panel className="max-w-xl p-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="text-xs font-semibold text-slate-400">Receipt Info</p>
          <FormField label="Supplier" required>
            <SupplierSelect
              value={form.supplierId}
              onChange={(e) => setForm((prev) => ({ ...prev, supplierId: e.target.value }))}
            />
          </FormField>
          <FormField label="Storage Location" required>
            <StorageLocationSelect
              value={form.storageLocationId}
              onChange={(e) => setForm((prev) => ({ ...prev, storageLocationId: e.target.value }))}
            />
          </FormField>
          <FormField label="Receipt Date" required>
            <Input
              type="date"
              value={form.receiptDt}
              onChange={handleFieldChange("receiptDt")}
            />
          </FormField>
          <FormField label="Handler" required>
            <Select
              placeholder="Select handler"
              options={employeeOptions}
              value={form.receivedById}
              onChange={(e) => setForm((prev) => ({ ...prev, receivedById: e.target.value }))}
            />
          </FormField>

          <p className="mt-2 text-xs font-semibold text-slate-400">Medication Item</p>
          <FormField label="Medication" required>
            <MedicationSearchInput
              value={item.medicationId}
              onChange={(medicationId) =>
                setForm((prev) => ({ ...prev, items: [{ ...prev.items[0], medicationId }] }))
              }
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

          <FormActions
            submitLabel="Register"
            cancelLabel="Cancel"
            onCancel={() => router.push("/pharmacy/receipt/list")}
          />
        </form>
      </Panel>
    </div>
  );
}
