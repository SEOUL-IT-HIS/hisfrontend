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
import Script from "next/script";

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
  zipCode: string;
  address: string;
  addressDetail: string;
  medRoleCode: string;
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
  roleCodes: CommonCodeItem[];
  onClose: () => void;
};

export default function EmpUpdateForm({
  emp,
  deptCodes,
  statusCodes,
  roleCodes,
  onClose,
}: EmpUpdateFormProps) {
  const [form, setForm] = useState<EmpUpdateFormState>({
    empName: emp.empName,
    empEmail: emp.empEmail ?? "",
    empPhone: emp.empPhone ?? "",
    retireDate: toDateInputValue(emp.retireDate),
    empStatus: emp.empStatus ?? "",
    deptCode: emp.deptCode ?? "",
    zipCode: emp.zipCode ?? "",
    address: emp.address ?? "",
    addressDetail: emp.addressDetail ?? "",
    medRoleCode: emp.medRoleCode ?? "",
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const error = useSelector((state: RootState) => state.emp.error);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(emp.profileImageUrl);
  const loading = useSelector((state: RootState) => state.emp.loading);
  const dispatch = useDispatch<AppDispatch>();
  const waitClose = useRef(false);


  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(file ? URL.createObjectURL(file) : emp.profileImageUrl);
  }

  type DaumPostcodeData = { zonecode: string; address: string };
  type DaumPostcodeWindow = {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: DaumPostcodeData) => void;
      }) => { open: () => void };
    };
  };

  function handleAddressSearch() {
    const daum = (window as unknown as DaumPostcodeWindow).daum;
    if (!daum) return;
    new daum.Postcode({
      oncomplete: (data) => {
        setForm((prev) => ({
          ...prev,
          zipCode: data.zonecode,
          address: data.address,
        }));
      },
    }).open();
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
      image: imageFile ?? undefined,
      zipCode: form.zipCode || undefined,
      address: form.address || undefined,
      addressDetail: form.addressDetail.trim() || undefined,
      medRoleCode: form.medRoleCode || undefined,
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

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  return (
    <div className="space-y-5">
      <Script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="afterInteractive" />
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

        <div className="grid grid-cols-2 gap-3">
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

          <FormField label="역할" htmlFor="medRoleCode">
            <Select
              id="medRoleCode"
              value={form.medRoleCode}
              placeholder="선택"
              onChange={(e) => setForm({ ...form, medRoleCode: e.target.value })}
              options={toCodeSelectOptions(roleCodes)}
            />
          </FormField>
        </div>

        <FormField label="주소" htmlFor="zipCode">
          <div className="flex gap-2">
            <Input id="zipCode" value={form.zipCode} placeholder="우편번호" disabled />
            <button
                type="button"
                onClick={handleAddressSearch}
                className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              주소 검색
            </button>
          </div>
          <Input value={form.address} placeholder="기본주소" disabled className="mt-2" />
          <Input
              value={form.addressDetail}
              placeholder="상세주소를 입력하세요 (예: 101동 202호)"
              onChange={(e) => setForm({ ...form, addressDetail: e.target.value })}
              className="mt-2"
          />
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

        <FormActions onCancel={onClose} submitLabel="수정" loading={loading} />
      </form>
    </div>
  );
}
