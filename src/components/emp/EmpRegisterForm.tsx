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
  ConfirmDialog,
  FormActions,
  FormField,
  Input,
  Select,
} from "@/components/common";
import type { CommonCodeItem } from "@/features/commonCode/types/commonCodeItemTypes";
import { checkRrnApi } from "@/features/emp/api/empApi";
import { fetchEmpRegisterRequest } from "@/features/emp/slice/empSlice";
import { toCodeSelectOptions } from "@/features/emp/utils/empCodeLabel";
import type { EmpRegisterRequest } from "@/features/emp/types/empTypes";
import type { AppDispatch, RootState } from "@/store/store";
import Script from "next/script";

type EmpRegisterFormState = {
  empName: string;
  empEmail: string;
  empPhone: string;
  hireDate: string;
  deptCode: string;
  zipCode: string;
  address: string;
  addressDetail: string;
  medRoleCode: string;
  rrn: string;
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
  roleCodes: CommonCodeItem[];
  onClose: () => void;
};

export default function EmpRegisterForm({
  deptCodes,
  roleCodes,
  onClose,
}: EmpRegisterFormProps) {
  const [form, setForm] = useState<EmpRegisterFormState>({
    empName: "",
    empEmail: "",
    empPhone: "",
    hireDate: "",
    deptCode: "",
    zipCode: "",
    address: "",
    addressDetail: "",
    medRoleCode: "",
    rrn: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const error = useSelector((state: RootState) => state.emp.error);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const loading = useSelector((state: RootState) => state.emp.loading);
  const emps = useSelector((state: RootState) => state.emp.emps);
  const dispatch = useDispatch<AppDispatch>();
  /** true 이면 이번 submit 의 완료를 기다리는 중 */
  const waitClose = useRef(false);
  /** 이름+연락처가 겹치는 기존 직원이 있어서 등록 여부를 다시 물어보는 중 */
  const [dupConfirmOpen, setDupConfirmOpen] = useState(false);

  /** 주민등록번호 실시간 중복확인 결과 안내 문구 (null이면 아직 확인 안 함) */
  const [rrnCheckMessage, setRrnCheckMessage] = useState<string | null>(null);

  /** 주민등록번호 입력칸에서 포커스가 벗어나면 서버에 중복 여부 + 생년월일을 물어본다 */
  async function handleRrnBlur() {
    const rrn = form.rrn.trim();
    if (!rrn) {
      setRrnCheckMessage(null);
      return;
    }
    const result = await checkRrnApi(rrn);
    const birthDateText = result.birthDate
      ? `생년월일 ${result.birthDate.slice(0, 10)} · `
      : "";
    setRrnCheckMessage(
      result.duplicate
        ? `${birthDateText}이미 등록된 주민등록번호입니다.`
        : `${birthDateText}사용 가능한 번호입니다.`,
    );
  }


  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(file ? URL.createObjectURL(file) : null);
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

  /** 폼 state를 실제 등록 요청 payload로 변환 */
  function buildPayload(): EmpRegisterRequest {
    return {
      empName: form.empName.trim(),
      empEmail: form.empEmail.trim() || undefined,
      empPhone: form.empPhone.trim() || undefined,
      hireDate: form.hireDate || undefined,
      deptCode: form.deptCode.trim() || undefined,
      image: imageFile ?? undefined,
      zipCode: form.zipCode || undefined,
      address: form.address || undefined,
      addressDetail: form.addressDetail.trim() || undefined,
      medRoleCode: form.medRoleCode || undefined,
      rrn: form.rrn.trim() || undefined,
    };
  }

  function submitRegister() {
    waitClose.current = true;
    dispatch(fetchEmpRegisterRequest(buildPayload()));
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

    // 이름+연락처가 똑같은 기존 직원이 있으면 등록을 막지 않고 한 번 더 확인만 한다.
    const isDuplicate = emps.some(
      (emp) =>
        emp.empName === form.empName.trim() &&
        emp.empPhone === form.empPhone.trim(),
    );
    if (isDuplicate) {
      setDupConfirmOpen(true);
      return;
    }

    submitRegister();
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
      <Script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="afterInteractive" />
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

        <FormField
          label="주민등록번호"
          htmlFor="rrn"
          hint="중복 확인 용도로만 사용되며, 원본은 저장하지 않고 해시로만 저장됩니다."
        >
          <Input
            id="rrn"
            value={form.rrn}
            placeholder="예: 9001011234567"
            onChange={(e) => {
              setForm({ ...form, rrn: e.target.value });
              setRrnCheckMessage(null);
            }}
            onBlur={handleRrnBlur}
          />
          {rrnCheckMessage && (
            <p
              className={
                rrnCheckMessage.includes("이미")
                  ? "text-xs text-red-600"
                  : "text-xs text-emerald-600"
              }
            >
              {rrnCheckMessage}
            </p>
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

        <FormActions onCancel={onClose} submitLabel="등록" loading={loading} />
      </form>

      <ConfirmDialog
        open={dupConfirmOpen}
        title="중복 확인"
        message={`이미 같은 이름(${form.empName.trim()})과 연락처로 등록된 직원이 있습니다. 그래도 등록하시겠습니까?`}
        confirmLabel="등록"
        submitting={loading}
        onConfirm={() => {
          setDupConfirmOpen(false);
          submitRegister();
        }}
        onCancel={() => setDupConfirmOpen(false)}
      />
    </div>
  );
}
