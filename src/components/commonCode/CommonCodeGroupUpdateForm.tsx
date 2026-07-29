"use client";

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  FormActions,
  FormField,
  Input,
  Select,
} from "@/components/common";
import { fetchCommonCodeGroupUpdateRequest } from "@/features/commonCode/slice/commonCodeGroupSlice";
import type {
  CommonCodeGroup,
  CommonCodeGroupUpdateRequest,
} from "@/features/commonCode/types/commonCodeGroupTypes";
import type { AppDispatch, RootState } from "@/store/store";

type CommonCodeGroupUpdateFormState = Pick<CommonCodeGroup, "groupName" | "useYn">;

type CommonCodeGroupUpdateFormProps = {
  group: CommonCodeGroup;
  onClose: () => void;
};

/**
 * 공통코드 그룹 수정 폼
 */
export default function CommonCodeGroupUpdateForm({
  group,
  onClose,
}: CommonCodeGroupUpdateFormProps) {
  const [form, setForm] = useState<CommonCodeGroupUpdateFormState>({
    groupName: group.groupName,
    useYn: group.useYn,
  });
  const error = useSelector((state: RootState) => state.commonCodeGroup.error);
  const loading = useSelector((state: RootState) => state.commonCodeGroup.loading);
  const dispatch = useDispatch<AppDispatch>();
  const waitClose = useRef(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    waitClose.current = true;
    const payload: CommonCodeGroupUpdateRequest = {
      groupId: group.groupId,
      groupName: form.groupName,
      useYn: form.useYn,
    };
    dispatch(fetchCommonCodeGroupUpdateRequest(payload));
  };

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
          label="그룹코드"
          htmlFor="groupCode"
          hint="식별키라 변경할 수 없습니다."
        >
          <Input id="groupCode" value={group.groupCode} disabled />
        </FormField>

        <FormField label="그룹명" required htmlFor="groupName">
          <Input
            id="groupName"
            value={form.groupName}
            placeholder="그룹명을 입력하세요"
            onChange={(e) => setForm({ ...form, groupName: e.target.value })}
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
