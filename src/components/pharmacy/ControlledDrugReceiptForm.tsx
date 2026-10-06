"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { registerControlledDrugReceiptRequest } from "@/features/pharmacy/slice";
import { FormActions, FormField, Input, PageHeader, Panel, Select } from "@/components/common";
import type { RootState } from "@/store/store";
import type { ReceiptRegisterRequest } from "@/features/pharmacy/types";
import { fetchEmpApi } from "@/features/emp/api/empApi";
import type { Emp } from "@/features/emp/types/empTypes";

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
  const [witnessStaffIds, setWitnessStaffIds] = useState<string[]>([]);
  const error = useSelector(
    (state: RootState) => state.pharmacy.controlledDrugRegisterError
  );

  // 처리자/입회자/담당자는 자유 텍스트로 받지 않고 admin에 실제 등록된 직원만 고를 수 있게 한다.
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
      witnessStaffIds.length === 0
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
        witnessStaffIds,
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
          <FormField label="Handler" required>
            <Select
              placeholder="Select handler"
              options={employeeOptions}
              value={receipt.receivedById}
              onChange={(e) => setReceipt((prev) => ({ ...prev, receivedById: e.target.value }))}
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
          {employeeLoadError && <p className="text-sm text-rose-500">{employeeLoadError}</p>}
          <FormField label="Staff" required hint="The pharmacist handling this transaction.">
            <Select
              placeholder="Select staff"
              options={employeeOptions}
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
            />
          </FormField>
          <FormField
            label="Witnesses"
            required
            hint="At least one witness is required by law. Ctrl/Cmd-click to select multiple."
          >
            <Select
              multiple
              options={employeeOptions}
              value={witnessStaffIds}
              onChange={(e) =>
                setWitnessStaffIds(
                  Array.from(e.target.selectedOptions, (opt) => opt.value)
                )
              }
              className="h-32"
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
