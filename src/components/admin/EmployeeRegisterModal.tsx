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
import type { CreateEmployeeRequest } from "@/features/admin/types";
import { selectCommonCodesByGroup } from "@/features/commoncode/slice";
import { CODE_GROUP } from "@/features/commoncode/types";

type EmployeeRegisterModalProps = {
  open: boolean;
  submitting: boolean;
  apiError: string;
  onClose: () => void;
  onSubmit: (payload: CreateEmployeeRequest) => void;
};

const initialForm = {
  empNo: "",
  name: "",
  email: "",
  phone: "",
  hireDate: "",
  empStatus: "01",
  deptCode: "",
  loginId: "",
  password: "",
  passwordConfirm: "",
};

export default function EmployeeRegisterModal({
  open,
  submitting,
  apiError,
  onClose,
  onSubmit,
}: EmployeeRegisterModalProps) {
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

  const [form, setForm] = useState(initialForm);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (!open) {
      setForm(initialForm);
      setValidationError("");
    }
  }, [open]);

  const error = validationError || apiError;

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      // 로그인 ID 비어 있으면 사번 입력 시 기본값으로 맞춤
      if (name === "empNo" && prev.loginId === prev.empNo) {
        next.loginId = value;
      }
      if (name === "empNo" && prev.loginId === "") {
        next.loginId = value;
      }
      return next;
    });
  }

  function handleClose() {
    if (submitting) {
      return;
    }
    onClose();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!form.empNo.trim() || !form.name.trim()) {
      setValidationError("사번과 이름은 필수입니다.");
      return;
    }

    if (!form.loginId.trim()) {
      setValidationError("로그인 ID는 필수입니다.");
      return;
    }

    if (!form.password) {
      setValidationError("임시 비밀번호는 필수입니다.");
      return;
    }

    if (form.password !== form.passwordConfirm) {
      setValidationError("임시 비밀번호와 확인 값이 일치하지 않습니다.");
      return;
    }

    if (form.password.length < 4) {
      setValidationError("임시 비밀번호는 4자 이상으로 입력해주세요.");
      return;
    }

    const payload: CreateEmployeeRequest = {
      empNo: form.empNo.trim(),
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      hireDate: form.hireDate || undefined,
      empStatus: form.empStatus,
      deptCode: form.deptCode || undefined,
      loginId: form.loginId.trim(),
      password: form.password,
    };

    setValidationError("");
    onSubmit(payload);
  }

  return (
    <Modal
      open={open}
      title="직원등록"
      titleId="employee-register-title"
      closeDisabled={submitting}
      onClose={handleClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? <Alert variant="error">{error}</Alert> : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="사번" required>
            <Input
              name="empNo"
              value={form.empNo}
              onChange={handleChange}
              maxLength={20}
              disabled={submitting}
            />
          </FormField>

          <FormField label="이름" required>
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

          <FormField label="재직상태">
            <Select
              name="empStatus"
              value={form.empStatus}
              onChange={handleChange}
              disabled={submitting || empStatusOptions.length === 0}
              options={empStatusOptions}
            />
          </FormField>

          <FormField label="부서" className="sm:col-span-2">
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

        <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-500">계정 (ACCOUNT)</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="로그인 ID"
              required
              className="sm:col-span-2"
              hint="기본값은 사번과 동일합니다. 변경 가능합니다."
            >
              <Input
                name="loginId"
                value={form.loginId}
                onChange={handleChange}
                maxLength={50}
                autoComplete="off"
                disabled={submitting}
                className="bg-white"
              />
            </FormField>

            <FormField label="임시 비밀번호" required>
              <Input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                maxLength={100}
                autoComplete="new-password"
                disabled={submitting}
                className="bg-white"
              />
            </FormField>

            <FormField label="비밀번호 확인" required>
              <Input
                type="password"
                name="passwordConfirm"
                value={form.passwordConfirm}
                onChange={handleChange}
                maxLength={100}
                autoComplete="new-password"
                disabled={submitting}
                className="bg-white"
              />
            </FormField>
          </div>
        </div>

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
    </Modal>
  );
}
