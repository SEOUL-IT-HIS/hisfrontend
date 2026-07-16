"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import type { CreateEmployeeRequest, EmpStatus } from "@/features/admin/types";
import { DEPT_CODE_OPTIONS, EMP_STATUS_OPTIONS } from "@/features/admin/types";

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
  empStatus: "ACTIVE" as EmpStatus,
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
  const [form, setForm] = useState(initialForm);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (!open) {
      setForm(initialForm);
      setValidationError("");
    }
  }, [open]);

  if (!open) {
    return null;
  }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="employee-register-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 id="employee-register-title" className="text-base font-semibold text-slate-800">
            직원등록
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
              <span className="font-medium text-slate-700">
                사번 <span className="text-rose-500">*</span>
              </span>
              <input
                name="empNo"
                value={form.empNo}
                onChange={handleChange}
                maxLength={20}
                disabled={submitting}
                className="h-10 rounded-lg border border-slate-200 px-3 outline-none focus:border-sky-400 disabled:bg-slate-50"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
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

            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
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

          <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-500">계정 (ACCOUNT)</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                <span className="font-medium text-slate-700">
                  로그인 ID <span className="text-rose-500">*</span>
                </span>
                <input
                  name="loginId"
                  value={form.loginId}
                  onChange={handleChange}
                  maxLength={50}
                  autoComplete="off"
                  disabled={submitting}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 outline-none focus:border-sky-400 disabled:bg-slate-50"
                />
                <span className="text-xs text-slate-400">기본값은 사번과 동일합니다. 변경 가능합니다.</span>
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">
                  임시 비밀번호 <span className="text-rose-500">*</span>
                </span>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  maxLength={100}
                  autoComplete="new-password"
                  disabled={submitting}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 outline-none focus:border-sky-400 disabled:bg-slate-50"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">
                  비밀번호 확인 <span className="text-rose-500">*</span>
                </span>
                <input
                  type="password"
                  name="passwordConfirm"
                  value={form.passwordConfirm}
                  onChange={handleChange}
                  maxLength={100}
                  autoComplete="new-password"
                  disabled={submitting}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 outline-none focus:border-sky-400 disabled:bg-slate-50"
                />
              </label>
            </div>
          </div>

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
