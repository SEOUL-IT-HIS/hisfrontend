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
import { checkRrnApi } from "@/features/emp/api/empApi";
import { fetchEmpRegisterRequest } from "@/features/emp/slice/empSlice";
import {
  toCodeSelectOptions,
  toRoleSelectOptions,
} from "@/features/emp/utils/empCodeLabel";
import type { RoleType } from "@/features/emp/types/roleType";
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
  /** 드롭다운에서 고른 역할 PK (ROLE.ROLE_ID) */
  roleId: string;
  rrn: string;
};

/** 필드별 인라인 검증 메시지 (§15.3: 검증은 필드 하단 인라인, Toast는 서버 결과에만) */
type FieldErrors = {
  empName?: string;
  empPhone?: string;
  hireDate?: string;
  deptCode?: string;
  rrn?: string;
};

type EmpRegisterFormProps = {
  deptCodes: CommonCodeItem[];
  roles: RoleType[];
  onClose: () => void;
};

export default function EmpRegisterForm({
  deptCodes,
  roles,
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
    roleId: "",
    rrn: "",
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const loading = useSelector((state: RootState) => state.emp.loading);
  const error = useSelector((state: RootState) => state.emp.error);
  /** 역할 배정자(assignedBy)로 보낼 로그인 사용자 */
  const authUser = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch<AppDispatch>();

  /** true 이면 이번 submit 의 완료를 기다리는 중 */
  const waitClose = useRef(false);

  /** 주민등록번호 실시간 중복확인 결과 안내 문구 (null이면 아직 확인 안 함) */
  const [rrnCheckMessage, setRrnCheckMessage] = useState<string | null>(null);

  /** 우편번호 스크립트가 다 받아졌는지 (false면 주소 검색 버튼을 못 누르게 막는다) */
  const [postcodeReady, setPostcodeReady] = useState(false);

  /** 숫자만 남긴 뒤 앞 6자리 뒤에 하이픈을 넣어준다 (예: 900101-1234567) */
  function formatRrn(value: string) {
    const digits = value.replace(/[^0-9]/g, "").slice(0, 13);
    if (digits.length <= 6) {
      return digits;
    }
    return digits.slice(0, 6) + "-" + digits.slice(6);
  }

  /** 주민등록번호 입력칸에서 포커스가 벗어나면 서버에 중복 여부 + 생년월일을 물어본다 */
  async function handleRrnBlur() {
    const rrn = form.rrn.trim();
    if (!rrn) {
      setRrnCheckMessage(null);
      return;
    }
    const result = await checkRrnApi(rrn);
    const birthDateText = result.birthDate
      ? `Date of birth ${result.birthDate.slice(0, 10)} · `
      : "";
    setRrnCheckMessage(
      result.duplicate
        ? `${birthDateText}This resident number is already registered.`
        : `${birthDateText}This number is available.`,
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
      roleIds: form.roleId ? [form.roleId] : undefined,
      assignedBy: authUser?.empId,
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
    if (!form.empName.trim()) nextErrors.empName = "Please enter a name.";
    if (!form.empPhone.trim()) nextErrors.empPhone = "Please enter a phone number.";
    if (!form.hireDate) nextErrors.hireDate = "Please enter a hire date.";
    if (!form.deptCode.trim()) nextErrors.deptCode = "Please select a department.";
    // 주민등록번호가 중복 확인의 유일한 기준이므로 반드시 받는다.
    if (!form.rrn.trim()) {
      nextErrors.rrn = "Please enter the resident registration number.";
    } else if (form.rrn.replace(/[^0-9]/g, "").length !== 13) {
      nextErrors.rrn = "Please enter all 13 digits.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

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
      <Script
        src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="afterInteractive"
        onReady={() => setPostcodeReady(true)}
      />
      {error ? <Alert variant="error">{error}</Alert> : null}

      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label="Name" required htmlFor="empName">
          <Input
            id="empName"
            value={form.empName}
            placeholder="Enter a name"
            onChange={(e) => setForm({ ...form, empName: e.target.value })}
          />
          {errors.empName && (
            <p className="text-xs text-red-600">{errors.empName}</p>
          )}
        </FormField>

        <FormField label="Email" htmlFor="empEmail">
          <Input
            id="empEmail"
            type="email"
            value={form.empEmail}
            placeholder="e.g. kim@hospital.com"
            onChange={(e) => setForm({ ...form, empEmail: e.target.value })}
          />
        </FormField>

        <FormField label="Phone" required htmlFor="empPhone">
          <Input
            id="empPhone"
            value={form.empPhone}
            placeholder="e.g. 010-1234-5678"
            onChange={(e) => setForm({ ...form, empPhone: e.target.value })}
          />
          {errors.empPhone && (
            <p className="text-xs text-red-600">{errors.empPhone}</p>
          )}
        </FormField>

        <FormField
          label="Resident Reg. No."
          required
          htmlFor="rrn"
          hint="Used only for duplicate checks. The number itself is never stored — only a hash."
        >
          <Input
            id="rrn"
            value={form.rrn}
            placeholder="e.g. 900101-1234567"
            inputMode="numeric"
            maxLength={14}
            onChange={(e) => {
              setForm({ ...form, rrn: formatRrn(e.target.value) });
              setRrnCheckMessage(null);
            }}
            onBlur={handleRrnBlur}
          />
          {errors.rrn && <p className="text-xs text-red-600">{errors.rrn}</p>}
          {rrnCheckMessage && (
            <p
              className={
                rrnCheckMessage.includes("already")
                  ? "text-xs text-red-600"
                  : "text-xs text-emerald-600"
              }
            >
              {rrnCheckMessage}
            </p>
          )}
        </FormField>

        <FormField label="Hire Date" required htmlFor="hireDate">
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
          <FormField label="Department" required htmlFor="deptCode">
            <Select
              id="deptCode"
              value={form.deptCode}
              placeholder="Select"
              onChange={(e) => setForm({ ...form, deptCode: e.target.value })}
              options={toCodeSelectOptions(deptCodes)}
            />
            {errors.deptCode && (
              <p className="text-xs text-red-600">{errors.deptCode}</p>
            )}
          </FormField>

          <FormField label="Role" htmlFor="roleId">
            <Select
              id="roleId"
              value={form.roleId}
              placeholder="Select"
              onChange={(e) => setForm({ ...form, roleId: e.target.value })}
              options={toRoleSelectOptions(roles)}
            />
          </FormField>
        </div>

        <FormField label="Address" htmlFor="zipCode">
          <div className="flex gap-2">
            <Input id="zipCode" value={form.zipCode} placeholder="Zip Code" disabled />
            <button
                type="button"
                onClick={handleAddressSearch}
                disabled={!postcodeReady}
                className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:bg-slate-50 disabled:text-slate-400"
            >
              {postcodeReady ? "Find Address" : "Loading…"}
            </button>
          </div>
          <Input value={form.address} placeholder="Street address" disabled className="mt-2" />
          <Input
              value={form.addressDetail}
              placeholder="Enter address detail (e.g. Bldg 101, Unit 202)"
              onChange={(e) => setForm({ ...form, addressDetail: e.target.value })}
              className="mt-2"
          />
        </FormField>

        <FormField label="Photo" htmlFor="image">
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
                  alt="Preview"
                  className="mt-2 h-20 w-20 rounded-full object-cover"
              />
          ) : null}
        </FormField>

        <FormActions onCancel={onClose} submitLabel="Register" loading={loading} />
      </form>
    </div>
  );
}
