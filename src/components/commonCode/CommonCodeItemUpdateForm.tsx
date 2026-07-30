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
          label="코드값"
          htmlFor="codeValue"
          hint="식별키라 변경할 수 없습니다."
        >
          <Input id="codeValue" value={item.codeValue} disabled />
        </FormField>

        <FormField label="코드명" required htmlFor="codeName">
          <Input
            id="codeName"
            value={form.codeName}
            placeholder="코드명을 입력하세요"
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
          submitLabel="수정"
          loading={loading}
        />
      </form>
    </div>
  );
}
