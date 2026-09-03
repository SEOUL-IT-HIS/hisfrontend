"use client";

/**
 * [항목 수정 폼]
 * - codeValue: 읽기 전용 (식별키)
 * - 수정 가능: codeName, useYn
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
import { fetchCommonCodeItemUpdateRequest } from "@/features/commonCode/slice/commonCodeItemSlice";
import type {
  CommonCodeItem,
  CommonCodeItemUpdateRequest,
} from "@/features/commonCode/types/commonCodeItemTypes";
import type { AppDispatch, RootState } from "@/store/store";

type CommonCodeItemUpdateFormState = Pick<
  CommonCodeItem,
  "codeName" | "useYn"
>;

type CommonCodeItemUpdateFormProps = {
  item: CommonCodeItem;
  onClose: () => void;
};

/**
 * 공통코드 항목 수정 폼
 */
export default function CommonCodeItemUpdateForm({
  item,
  onClose,
}: CommonCodeItemUpdateFormProps) {
  const [form, setForm] = useState<CommonCodeItemUpdateFormState>({
    codeName: item.codeName,
    useYn: item.useYn,
  });
  const error = useSelector((state: RootState) => state.commonCodeItem.error);
  const loading = useSelector((state: RootState) => state.commonCodeItem.loading);
  const dispatch = useDispatch<AppDispatch>();
  const waitClose = useRef(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    waitClose.current = true;
    const payload: CommonCodeItemUpdateRequest = {
      codeId: item.codeId,
      codeName: form.codeName,
      useYn: form.useYn,
    };
    dispatch(fetchCommonCodeItemUpdateRequest(payload));
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
          label="Code Value"
          htmlFor="codeValue"
          hint="Identifier — cannot be changed."
        >
          <Input id="codeValue" value={item.codeValue} disabled />
        </FormField>

        <FormField label="Code Name" required htmlFor="codeName">
          <Input
            id="codeName"
            value={form.codeName}
            placeholder="Enter a code name"
            onChange={(e) => setForm({ ...form, codeName: e.target.value })}
          />
        </FormField>

        <FormField label="Status" required htmlFor="useYn">
          <Select
            id="useYn"
            value={form.useYn}
            onChange={(e) => setForm({ ...form, useYn: e.target.value })}
            options={[
              { value: "Y", label: "Active (Y)" },
              { value: "N", label: "Inactive (N)" },
            ]}
          />
        </FormField>

        <FormActions
          onCancel={onClose}
          submitLabel="Save"
          loading={loading}
        />
      </form>
    </div>
  );
}
