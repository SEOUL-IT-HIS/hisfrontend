"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { registerControlledDrugIssuanceRequest } from "@/features/pharmacy/slice";
import { FormActions, FormField, Input, PageHeader, Panel, Select } from "@/components/common";
import type { RootState } from "@/store/store";
import { fetchEmpApi } from "@/features/emp/api/empApi";
import type { Emp } from "@/features/emp/types/empTypes";

/** 마약류 출고 관리 (HL2-14) — 출고 자체는 IssuanceRegisterForm과 같은 항목, 처리자/입회자만 더 받는다. */
export default function ControlledDrugIssuanceForm() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [medicationId, setMedicationId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [staffId, setStaffId] = useState("");
  const [witnessStaffIds, setWitnessStaffIds] = useState<string[]>([]);
  const error = useSelector(
    (state: RootState) => state.pharmacy.controlledDrugRegisterError
  );

  // 처리자/입회자는 자유 텍스트로 받지 않고 admin에 실제 등록된 직원만 고를 수 있게 한다.
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

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!medicationId || !quantity || !staffId || witnessStaffIds.length === 0) return;

    dispatch(
      registerControlledDrugIssuanceRequest({
        issuance: { medicationId, quantity: Number(quantity) },
        staffId,
        witnessStaffIds,
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
      {employeeLoadError && <p className="text-sm text-rose-500">{employeeLoadError}</p>}
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
