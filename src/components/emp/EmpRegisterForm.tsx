"use client";

/**
 * [직원 등록 폼]
 * Modal 안에서 사용. 제목은 Modal title.
 *
 * 성공 시 모달 닫기:
 * waitClose ref 로 "이번에 제출한 요청" 인지 구분
 * → loading false + error 없음 → onClose()
 *
 * 부서는 DEPT_CD 공통코드 Select (저장값은 codeValue)
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
import { fetchEmpRegisterRequest } from "@/features/emp/slice/empSlice";
import { toCodeSelectOptions } from "@/features/emp/utils/empCodeLabel";
import type { EmpRegisterRequest } from "@/features/emp/types/empTypes";
import type { AppDispatch, RootState } from "@/store/store";

type EmpRegisterFormState = {
  empName: string;
  empEmail: string;
  empPhone: string;
  hireDate: string;
  deptCode: string;
};

type EmpRegisterFormProps = {
  deptCodes: CommonCodeItem[];
  onClose: () => void;
};

export default function EmpRegisterForm({
  deptCodes,
  onClose,
}: EmpRegisterFormProps) {
  const [form, setForm] = useState<EmpRegisterFormState>({
    empName: "",
    empEmail: "",
    empPhone: "",
    hireDate: "",
    deptCode: "",
  });
  const error = useSelector((state: RootState) => state.emp.error);
  const loading = useSelector((state: RootState) => state.emp.loading);
  const dispatch = useDispatch<AppDispatch>();
  /** true 이면 이번 submit 의 완료를 기다리는 중 */
  const waitClose = useRef(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    waitClose.current = true;
    const payload: EmpRegisterRequest = {
      empName: form.empName.trim(),
      empEmail: form.empEmail.trim() || undefined,
      empPhone: form.empPhone.trim() || undefined,
      hireDate: form.hireDate || undefined,
      deptCode: form.deptCode.trim() || undefined,
    };
    dispatch(fetchEmpRegisterRequest(payload));
  };

  useEffect(() => {
    if (!waitClose.current) return;
    if (loading) return;
    if (error) {
      waitClose.current = false;
      return; // 실패 → 모달 유지
    }
    waitClose.current = false;
    onClose(); // 성공 → 모달 닫기
  }, [loading, error, onClose]);

  return (
    <div className="space-y-5">
      {error ? <Alert variant="error">{error}</Alert> : null}

      <form onSubmit={onSubmit} className="space-y-4">
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

        <FormField label="입사일" htmlFor="hireDate">
          <Input
            id="hireDate"
            type="date"
            value={form.hireDate}
            onChange={(e) => setForm({ ...form, hireDate: e.target.value })}
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

        <FormActions onCancel={onClose} submitLabel="등록" loading={loading} />
      </form>
    </div>
  );
}
