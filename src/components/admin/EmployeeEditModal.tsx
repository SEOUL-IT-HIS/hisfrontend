"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { resolveAdmMessage } from "@/features/admin/messages";
import type { Employee, EmpStatus, UpdateEmployeeRequest } from "@/features/admin/types";
import { DEPT_CODE_OPTIONS, EMP_STATUS_OPTIONS } from "@/features/admin/types";

type EmployeeEditModalProps = {
  open: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSubmit: (empId: number, payload: UpdateEmployeeRequest) => void | Promise<void>;
};

type EditForm = {
  name: string;
  email: string;
  phone: string;
  hireDate: string;
  retireDate: string;
  empStatus: EmpStatus;
  deptCode: string;
};

function toForm(employee: Employee): EditForm {
  return {
    name: employee.name ?? "",
    email: employee.email ?? "",
    phone: employee.phone ?? "",
    hireDate: employee.hireDate ?? "",
    retireDate: employee.retireDate ?? "",
    empStatus: employee.empStatus ?? "ACTIVE",
    deptCode: employee.deptCode ?? "",
  };
}

export default function EmployeeEditModal({
  open,
  employee,
  onClose,
  onSubmit,
}: EmployeeEditModalProps) {
  const [form, setForm] = useState<EditForm>({
    name: "",
    email: "",
    phone: "",
    hireDate: "",
    retireDate: "",
    empStatus: "ACTIVE",
    deptCode: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && employee) {
      setForm(toForm(employee));
      setError("");
    }
  }, [open, employee]);

  if (!open || !employee) {
    return null;
  }

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleClose() {
    if (submitting) {
      return;
    }
    setError("");
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!employee) {
      return;
    }

    if (!form.name.trim()) {
      setError("이름은 필수입니다.");
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

    setSubmitting(true);
    setError("");
    try {
      await onSubmit(empId, payload);
      setError("");
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "직원 수정에 실패했습니다.";
      setError(resolveAdmMessage(message));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="employee-edit-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 id="employee-edit-title" className="text-base font-semibold text-slate-800">
            직원수정
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          {error ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">사번</span>
              <input
                value={employee.empNo}
                readOnly
                disabled
                className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-500 outline-none"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">로그인 ID</span>
              <input
                value={employee.loginId}
                readOnly
                disabled
                className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-500 outline-none"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-slate-700">
                이름 <span className="text-rose-500">*</span>
              </span>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                maxLength={100}
                disabled={submitting}
                className="h-10 rounded-lg border border-slate-200 px-3 outline-none focus:border-sky-400 disabled:bg-slate-50"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">이메일</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                maxLength={200}
                disabled={submitting}
                className="h-10 rounded-lg border border-slate-200 px-3 outline-none focus:border-sky-400 disabled:bg-slate-50"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">연락처</span>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                maxLength={20}
                disabled={submitting}
                className="h-10 rounded-lg border border-slate-200 px-3 outline-none focus:border-sky-400 disabled:bg-slate-50"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">입사일</span>
              <input
                type="date"
                name="hireDate"
                value={form.hireDate}
                onChange={handleChange}
                disabled={submitting}
                className="h-10 rounded-lg border border-slate-200 px-3 outline-none focus:border-sky-400 disabled:bg-slate-50"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">퇴사일</span>
              <input
                type="date"
                name="retireDate"
                value={form.retireDate}
                onChange={handleChange}
                disabled={submitting}
                className="h-10 rounded-lg border border-slate-200 px-3 outline-none focus:border-sky-400 disabled:bg-slate-50"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">재직상태</span>
              <select
                name="empStatus"
                value={form.empStatus}
                onChange={handleChange}
                disabled={submitting}
                className="h-10 rounded-lg border border-slate-200 px-3 outline-none focus:border-sky-400 disabled:bg-slate-50"
              >
                {EMP_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">부서</span>
              <select
                name="deptCode"
                value={form.deptCode}
                onChange={handleChange}
                disabled={submitting}
                className="h-10 rounded-lg border border-slate-200 px-3 outline-none focus:border-sky-400 disabled:bg-slate-50"
              >
                <option value="">선택</option>
                {DEPT_CODE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="text-xs text-slate-400">
            사번·로그인 ID는 수정할 수 없습니다. 비밀번호 변경은 별도 기능에서 처리합니다.
          </p>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="h-10 rounded-lg border border-slate-200 px-4 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-10 rounded-lg bg-sky-500 px-4 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50"
            >
              {submitting ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
