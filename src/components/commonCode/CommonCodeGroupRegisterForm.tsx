"use client";

/**
 * [그룹 등록 폼]
 * Modal 안에서 사용. 제목은 Modal title.
 *
 * 성공 시 모달 닫기:
 * waitClose ref 로 "이번에 제출한 요청" 인지 구분
 * → loading false + error 없음 → onClose()
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
import type { CommonCodeGroup } from "@/features/commonCode/types/commonCodeGroupTypes";
import { fetchCommonCodeGroupRegisterRequest } from "@/features/commonCode/slice/commonCodeGroupSlice";
import type { AppDispatch, RootState } from "@/store/store";

type CommonCodeGroupRegisterFormState = Pick<
  CommonCodeGroup,
  "groupCode" | "groupName" | "useYn"
>;

export default function CommonCodeGroupRegisterForm({
  onClose,
}: {
  onClose: () => void;
}) {
  const [form, setForm] = useState<CommonCodeGroupRegisterFormState>({
    groupCode: "",
    groupName: "",
    useYn: "Y",
  });
  const error = useSelector((state: RootState) => state.commonCodeGroup.error);
  const loading = useSelector((state: RootState) => state.commonCodeGroup.loading);
  const dispatch = useDispatch<AppDispatch>();
  /** true 이면 이번 submit 의 완료를 기다리는 중 */
  const waitClose = useRef(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    waitClose.current = true;
    dispatch(fetchCommonCodeGroupRegisterRequest(form));
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
        <FormField
          label="그룹코드"
          required
          htmlFor="groupCode"
          hint="등록 후 변경할 수 없습니다."
        >
          <Input
            id="groupCode"
            value={form.groupCode}
            placeholder="예: DEPT"
            onChange={(e) => setForm({ ...form, groupCode: e.target.value })}
          />
        </FormField>

        <FormField label="그룹명" required htmlFor="groupName">
          <Input
            id="groupName"
            value={form.groupName}
            placeholder="예: 진료과"
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
          submitLabel="등록"
          loading={loading}
        />
      </form>
    </div>
  );
}
