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

/** 필드별 인라인 검증 메시지 (§15.3: 검증은 필드 하단 인라인, Toast는 서버 결과에만) */
type FieldErrors = {
  empName?: string;
  empPhone?: string;
  hireDate?: string;
  deptCode?: string;
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
  const [errors, setErrors] = useState<FieldErrors>({});
  const error = useSelector((state: RootState) => state.emp.error);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const loading = useSelector((state: RootState) => state.emp.loading);
  const dispatch = useDispatch<AppDispatch>();
  /** true 이면 이번 submit 의 완료를 기다리는 중 */
  const waitClose = useRef(false);


  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: FieldErrors = {};
    if (!form.empName.trim()) nextErrors.empName = "이름을 입력해주세요.";
    if (!form.empPhone.trim()) nextErrors.empPhone = "연락처를 입력해주세요.";
    if (!form.hireDate) nextErrors.hireDate = "입사일을 입력해주세요.";
    if (!form.deptCode.trim()) nextErrors.deptCode = "부서를 선택해주세요.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    waitClose.current = true;
    const payload: EmpRegisterRequest = {
      empName: form.empName.trim(),
      empEmail: form.empEmail.trim() || undefined,
      empPhone: form.empPhone.trim() || undefined,
      hireDate: form.hireDate || undefined,
      deptCode: form.deptCode.trim() || undefined,
      image: imageFile ?? undefined,
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

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

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

        <FormField label="입사일" required htmlFor="hireDate">
          <Input
            id="hireDate"
            type="date"
            value={form.hireDate}
            onChange={(e) => setForm({ ...form, hireDate: e.target.value })}
          />
          {errors.hireDate && (
            <p className="text-xs text-red-600">{errors.hireDate}</p>
          )}
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

        <FormField label="사진" htmlFor="image">
          <input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-sky-700"
          />
          {imagePreview ? (
              <img
                  src={imagePreview}
                  alt="미리보기"
                  className="mt-2 h-20 w-20 rounded-full object-cover"
              />
          ) : null}
        </FormField>

        <FormActions onCancel={onClose} submitLabel="등록" loading={loading} />
      </form>
    </div>
  );
}
