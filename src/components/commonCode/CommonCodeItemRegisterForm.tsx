"use client";

/**
 * [항목 등록 폼]
 * - groupId 는 props 로 받음 (입력칸 없음)
 * - codeValue 는 등록 후 수정 불가
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
import { fetchCommonCodeItemRegisterRequest } from "@/features/commonCode/slice/commonCodeItemSlice";
import type {
  CommonCodeItem,
  CommonCodeItemRegisterRequest,
} from "@/features/commonCode/types/commonCodeItemTypes";
import type { AppDispatch, RootState } from "@/store/store";

type CommonCodeItemRegisterFormState = Pick<
  CommonCodeItem,
  "codeValue" | "codeName" | "useYn"
>;

type CommonCodeItemRegisterFormProps = {
  onClose: () => void;
  groupId: number;
};

/**
 * 공통코드 항목 등록 폼
 */
export default function CommonCodeItemRegisterForm({
  onClose,
  groupId,
}: CommonCodeItemRegisterFormProps) {
  const [form, setForm] = useState<CommonCodeItemRegisterFormState>({
    codeValue: "",
    codeName: "",
    useYn: "Y",
  });
  const error = useSelector((state: RootState) => state.commonCodeItem.error);
  const loading = useSelector((state: RootState) => state.commonCodeItem.loading);
  const dispatch = useDispatch<AppDispatch>();
  const waitClose = useRef(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    waitClose.current = true;
    const payload: CommonCodeItemRegisterRequest = {
      groupId,
      codeValue: form.codeValue,
      codeName: form.codeName,
      useYn: form.useYn,
    };
    dispatch(fetchCommonCodeItemRegisterRequest(payload));
  };

  // 등록 성공 시에만 Modal 닫기
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
          label="코드값"
          required
          htmlFor="codeValue"
          hint="등록 후 변경할 수 없습니다."
        >
          <Input
            id="codeValue"
            value={form.codeValue}
            placeholder="예: 01"
            onChange={(e) => setForm({ ...form, codeValue: e.target.value })}
          />
        </FormField>

        <FormField label="코드명" required htmlFor="codeName">
          <Input
            id="codeName"
            value={form.codeName}
            placeholder="예: 내과"
            onChange={(e) => setForm({ ...form, codeName: e.target.value })}
          />
        </FormField>

        <FormField label="사용여부" required htmlFor="useYn">
          <Select
            id="useYn"
            value={form.useYn}
            onChange={(e) => setForm({ ...form, useYn: e.target.value })}
            options={[
              { value: "Y", label: "사용 (Y)" },
              { value: "N", label: "미사용 (N)" },
            ]}
          />
        </FormField>

        <FormActions
          onCancel={onClose}
          submitLabel="등록"
          loading={loading}
        />
      </form>
    </div>
  );
}
