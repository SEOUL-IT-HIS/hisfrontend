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

type EmpUpdateFormProps = {
  emp: Emp;
  deptCodes: CommonCodeItem[];
  statusCodes: CommonCodeItem[];
  onClose: () => void;
};

export default function EmpUpdateForm({
  emp,
  deptCodes,
  statusCodes,
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
  const error = useSelector((state: RootState) => state.emp.error);
  const loading = useSelector((state: RootState) => state.emp.loading);
  const dispatch = useDispatch<AppDispatch>();
  const waitClose = useRef(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    waitClose.current = true;
    const payload: EmpUpdateRequest = {
      empId: emp.empId,
      empName: form.empName.trim(),
      empEmail: form.empEmail.trim() || undefined,
      empPhone: form.empPhone.trim() || undefined,
      retireDate: form.retireDate || undefined,
      empStatus: form.empStatus.trim() || undefined,
      deptCode: form.deptCode.trim() || undefined,
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

        <FormField label="연락처" htmlFor="empPhone">
          <Input
            id="empPhone"
            value={form.empPhone}
            placeholder="예: 010-1234-5678"
            onChange={(e) => setForm({ ...form, empPhone: e.target.value })}
          />
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

        <FormField label="부서" htmlFor="deptCode">
          <Select
            id="deptCode"
            value={form.deptCode}
            placeholder="선택"
            onChange={(e) => setForm({ ...form, deptCode: e.target.value })}
            options={toCodeSelectOptions(deptCodes)}
          />
        </FormField>

        <FormActions onCancel={onClose} submitLabel="수정" loading={loading} />
      </form>
    </div>
  );
}
