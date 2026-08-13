"use client";

/**
 * [직원 수정 폼]
 * - empNo: 읽기 전용 (식별키)
 * - 수정 가능: empName, empEmail, empPhone, retireDate, empStatus, deptCode
 * - 부서/재직상태: 공통코드 Select (저장값은 codeValue, 화면은 codeName)
 */
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  FormActions,
  FormField,
  Input,
  Select,
} from "@/components/common";
import type { CommonCodeItem } from "@/features/commonCode/types/commonCodeItemTypes";
import { fetchEmpUpdateRequest } from "@/features/emp/slice/empSlice";
import type { RoleType } from "@/features/emp/types/roleType";
import { toCodeSelectOptions } from "@/features/emp/utils/empCodeLabel";
import type { Emp, EmpUpdateRequest } from "@/features/emp/types/empTypes";
import type { AppDispatch, RootState } from "@/store/store";

/** ISO / Timestamp 문자열 → date input 용 yyyy-MM-dd */
function toDateInputValue(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

type EmpUpdateFormState = {
  empName: string;
  empEmail: string;
  empPhone: string;
  retireDate: string;
  empStatus: string;
  deptCode: string;
};

/** 필드별 인라인 검증 메시지 (EmpRegisterForm과 동일 규칙) */
type FieldErrors = {
  empName?: string;
  empPhone?: string;
  deptCode?: string;
};

type EmpUpdateFormProps = {
  emp: Emp;
  deptCodes: CommonCodeItem[];
  statusCodes: CommonCodeItem[];
  roles: RoleType[];
  onClose: () => void;
};

export default function EmpUpdateForm({
  emp,
  deptCodes,
  statusCodes,
  roles,
  onClose,
}: EmpUpdateFormProps) {
  const [form, setForm] = useState<EmpUpdateFormState>({
    empName: emp.empName,
    empEmail: emp.empEmail ?? "",
    empPhone: emp.empPhone ?? "",
    retireDate: toDateInputValue(emp.retireDate),
    empStatus: emp.empStatus ?? "",
    deptCode: emp.deptCode ?? "",
  });
  /** 배정할 역할 (다중 선택) */
  const [roleIds, setRoleIds] = useState<string[]>(emp.roleIds ?? []);
  const [errors, setErrors] = useState<FieldErrors>({});
  const error = useSelector((state: RootState) => state.emp.error);
  const loading = useSelector((state: RootState) => state.emp.loading);
  /** 역할 부여 주체 — 로그인한 관리자 empId */
  const assignedBy = useSelector((state: RootState) => state.auth.user?.empId);
  const dispatch = useDispatch<AppDispatch>();
  const waitClose = useRef(false);

  function toggleRole(roleId: string) {
    setRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId],
    );
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: FieldErrors = {};
    if (!form.empName.trim()) nextErrors.empName = "이름을 입력해주세요.";
    if (!form.empPhone.trim()) nextErrors.empPhone = "연락처를 입력해주세요.";
    if (!form.deptCode.trim()) nextErrors.deptCode = "부서를 선택해주세요.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    waitClose.current = true;
    const payload: EmpUpdateRequest = {
      empId: emp.empId,
      empName: form.empName.trim(),
      empEmail: form.empEmail.trim() || undefined,
      empPhone: form.empPhone.trim() || undefined,
      retireDate: form.retireDate || undefined,
      empStatus: form.empStatus.trim() || undefined,
      deptCode: form.deptCode.trim() || undefined,
      roleIds,
      assignedBy,
    };
    dispatch(fetchEmpUpdateRequest(payload));
  };

  // 수정 성공 시에만 Modal 닫기
  useEffect(() => {
    if (!waitClose.current) return;
    if (loading) return;
    if (error) {
      waitClose.current = false;
      return;
    }
    waitClose.current = false;
    onClose();
  }, [loading, error, onClose]);

  return (
    <div className="space-y-5">
      {error ? <Alert variant="error">{error}</Alert> : null}

      <form onSubmit={onSubmit} className="space-y-4">
        <FormField
          label="사번"
          htmlFor="empNo"
          hint="식별키라 변경할 수 없습니다."
        >
          <Input id="empNo" value={emp.empNo} disabled />
        </FormField>

        <FormField label="이름" required htmlFor="empName">
          <Input
            id="empName"
            value={form.empName}
            placeholder="이름을 입력하세요"
            onChange={(e) => setForm({ ...form, empName: e.target.value })}
          />
          {errors.empName && (
            <p className="text-xs text-red-600">{errors.empName}</p>
          )}
        </FormField>

        <FormField label="이메일" htmlFor="empEmail">
          <Input
            id="empEmail"
            type="email"
            value={form.empEmail}
            placeholder="예: kim@hospital.com"
            onChange={(e) => setForm({ ...form, empEmail: e.target.value })}
          />
        </FormField>

        <FormField label="연락처" required htmlFor="empPhone">
          <Input
            id="empPhone"
            value={form.empPhone}
            placeholder="예: 010-1234-5678"
            onChange={(e) => setForm({ ...form, empPhone: e.target.value })}
          />
          {errors.empPhone && (
            <p className="text-xs text-red-600">{errors.empPhone}</p>
          )}
        </FormField>

        <FormField label="퇴사일" htmlFor="retireDate">
          <Input
            id="retireDate"
            type="date"
            value={form.retireDate}
            onChange={(e) => setForm({ ...form, retireDate: e.target.value })}
          />
        </FormField>

        <FormField label="재직상태" htmlFor="empStatus">
          <Select
            id="empStatus"
            value={form.empStatus}
            placeholder="선택"
            onChange={(e) => setForm({ ...form, empStatus: e.target.value })}
            options={toCodeSelectOptions(statusCodes)}
          />
        </FormField>

        <FormField label="부서" required htmlFor="deptCode">
          <Select
            id="deptCode"
            value={form.deptCode}
            placeholder="선택"
            onChange={(e) => setForm({ ...form, deptCode: e.target.value })}
            options={toCodeSelectOptions(deptCodes)}
          />
          {errors.deptCode && (
            <p className="text-xs text-red-600">{errors.deptCode}</p>
          )}
        </FormField>

        <FormField label="역할" hint="다중 선택 가능">
          <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
            {roles.length === 0 ? (
              <span className="text-sm text-slate-400">
                등록된 역할이 없습니다.
              </span>
            ) : (
              roles.map((role) => (
                <label
                  key={role.roleId}
                  className="flex items-center gap-2 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={roleIds.includes(role.roleId)}
                    onChange={() => toggleRole(role.roleId)}
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400"
                  />
                  {role.roleName}
                </label>
              ))
            )}
          </div>
        </FormField>

        <FormActions onCancel={onClose} submitLabel="수정" loading={loading} />
      </form>
    </div>
  );
}
