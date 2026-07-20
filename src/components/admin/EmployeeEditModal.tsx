"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useSelector } from "react-redux";
import {
  Alert,
  Button,
  FormField,
  Input,
  Modal,
  Select,
} from "@/components/common";
import type { Employee, UpdateEmployeeRequest } from "@/features/admin/types";
import { selectCommonCodesByGroup } from "@/features/commoncode/slice";
import { CODE_GROUP } from "@/features/commoncode/types";

type EmployeeEditModalProps = {
  open: boolean;
  employee: Employee | null;
  submitting: boolean;
  apiError: string;
  onClose: () => void;
  onSubmit: (empId: number, payload: UpdateEmployeeRequest) => void;
};

type EditForm = {
  name: string;
  email: string;
  phone: string;
  hireDate: string;
  retireDate: string;
  empStatus: string;
  deptCode: string;
};

function toForm(employee: Employee): EditForm {
  return {
    name: employee.name ?? "",
    email: employee.email ?? "",
    phone: employee.phone ?? "",
    hireDate: employee.hireDate ?? "",
    retireDate: employee.retireDate ?? "",
    empStatus: employee.empStatus ?? "01",
    deptCode: employee.deptCode ?? "",
  };
}

export default function EmployeeEditModal({
  open,
  employee,
  submitting,
  apiError,
  onClose,
  onSubmit,
}: EmployeeEditModalProps) {
  const empStatusCodes = useSelector(selectCommonCodesByGroup(CODE_GROUP.EMP_STATUS_CD));
  const deptCodes = useSelector(selectCommonCodesByGroup(CODE_GROUP.DEPT_CD));

  const empStatusOptions = useMemo(
    () =>
      empStatusCodes.map((c) => ({
        value: c.codeValue,
        label: c.codeName,
      })),
    [empStatusCodes],
  );

  const deptOptions = useMemo(
    () =>
      deptCodes.map((c) => ({
        value: c.codeValue,
        label: c.codeName,
      })),
    [deptCodes],
  );

  const [form, setForm] = useState<EditForm>({
    name: "",
    email: "",
    phone: "",
    hireDate: "",
    retireDate: "",
    empStatus: "01",
    deptCode: "",
  });
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (open && employee) {
      setForm(toForm(employee));
      setValidationError("");
    }
  }, [open, employee]);

  const error = validationError || apiError;

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleClose() {
    if (submitting) {
      return;
    }
    onClose();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!employee) {
      return;
    }

    if (!form.name.trim()) {
      setValidationError("이름은 필수입니다.");
      return;
    }

    const empId = employee.empId;
    const payload: UpdateEmployeeRequest = {
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      hireDate: form.hireDate || undefined,
      retireDate: form.retireDate || undefined,
      empStatus: form.empStatus,
      deptCode: form.deptCode || undefined,
    };

    setValidationError("");
    onSubmit(empId, payload);
  }

  return (
    <Modal
      open={open && employee !== null}
      title="직원수정"
      titleId="employee-edit-title"
      closeDisabled={submitting}
      onClose={handleClose}
    >
      {employee ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? <Alert variant="error">{error}</Alert> : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="사번">
              <Input value={employee.empNo} readOnly disabled />
            </FormField>

            <FormField label="로그인 ID">
              <Input value={employee.loginId} readOnly disabled />
            </FormField>

            <FormField label="이름" required className="sm:col-span-2">
              <Input
                name="name"
                value={form.name}
                onChange={handleChange}
                maxLength={100}
                disabled={submitting}
              />
            </FormField>

            <FormField label="이메일">
              <Input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                maxLength={200}
                disabled={submitting}
              />
            </FormField>

            <FormField label="연락처">
              <Input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                maxLength={20}
                disabled={submitting}
              />
            </FormField>

            <FormField label="입사일">
              <Input
                type="date"
                name="hireDate"
                value={form.hireDate}
                onChange={handleChange}
                disabled={submitting}
              />
            </FormField>

            <FormField label="퇴사일">
              <Input
                type="date"
                name="retireDate"
                value={form.retireDate}
                onChange={handleChange}
                disabled={submitting}
              />
            </FormField>

            <FormField label="재직상태">
              <Select
                name="empStatus"
                value={form.empStatus}
                onChange={handleChange}
                disabled={submitting || empStatusOptions.length === 0}
                options={empStatusOptions}
              />
            </FormField>

            <FormField label="부서">
              <Select
                name="deptCode"
                value={form.deptCode}
                onChange={handleChange}
                disabled={submitting || deptOptions.length === 0}
                options={deptOptions}
                placeholder="선택"
              />
            </FormField>
          </div>

          <p className="text-xs text-slate-400">
            사번·로그인 ID는 수정할 수 없습니다. 비밀번호 변경은 별도 기능에서 처리합니다.
          </p>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="h-10"
              onClick={handleClose}
              disabled={submitting}
            >
              취소
            </Button>
            <Button type="submit" variant="primary" className="h-10" disabled={submitting}>
              {submitting ? "저장 중..." : "저장"}
            </Button>
          </div>
        </form>
      ) : null}
    </Modal>
  );
}
