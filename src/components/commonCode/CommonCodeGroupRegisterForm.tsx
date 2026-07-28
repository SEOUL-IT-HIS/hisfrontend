"use client";

import {useRef, useState, useEffect} from "react";
import {useDispatch, useSelector} from 'react-redux'
import {
  Alert,
  Button,
  FormField,
  Input,
  PageHeader,
  Select,
} from "@/components/common";
import type { CommonCodeGroup } from "@/features/commonCode/types/commonCodeGroupTypes";
import {fetchCommonCodeGroupRegisterRequest} from "@/features/commonCode/slice/commonCodeGroupSlice";
import {RootState} from "@/store/store";


type CommonCodeGroupRegisterFormState = Pick<
  CommonCodeGroup,
  "groupCode" | "groupName" | "useYn"
>;
/**
 * 공통코드 그룹 등록 폼
 * - 공통 UI(PageHeader / FormField / Input / Select / Button / Alert)만 적용
 * - 등록 API / saga 연결은 이후 작업
 */
export default function CommonCodeGroupRegisterForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<CommonCodeGroupRegisterFormState>({
    groupCode: "",
    groupName: "",
    useYn: "Y",
  });
  const error = useSelector((state: RootState) => state.commonCodeGroup.error);
  const loading = useSelector((state: RootState) => state.commonCodeGroup.loading);
  const dispatch = useDispatch();
  const waitClose = useRef(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    waitClose.current = true;
    dispatch(fetchCommonCodeGroupRegisterRequest(form))
  };
  useEffect(() => {
    if (!waitClose.current) return;
    if (loading) return;          // 아직 처리 중
    if (error) {                  // 실패 → 모달 유지
      waitClose.current = false;
      return;
    }
    waitClose.current = false;
    onClose();                    // 성공 → 모달 닫기
  }, [loading, error, onClose]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3">
      <PageHeader title="공통코드 그룹 등록" />

      {error ? <Alert variant="error">{error}</Alert> : null}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <form onSubmit={onSubmit} className="space-y-4">
          <FormField label="그룹코드" required htmlFor="groupCode">
            <Input
              id="groupCode"
              value={form.groupCode}
              onChange={(e) => setForm({ ...form, groupCode: e.target.value })}
            />
          </FormField>

          <FormField label="그룹명" required htmlFor="groupName">
            <Input
              id="groupName"
              value={form.groupName}
              onChange={(e) => setForm({ ...form, groupName: e.target.value })}
            />
          </FormField>

          <FormField label="사용여부" required htmlFor="useYn">
            <Select
              id="useYn"
              value={form.useYn}
              onChange={(e) => setForm({ ...form, useYn: e.target.value })}
              options={[
                { value: "Y", label: "Y" },
                { value: "N", label: "N" },
              ]}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="submit" variant="primary">
              등록
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
