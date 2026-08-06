"use client";

import type { ChangeEvent } from "react";
import { useCommonCodeOptions } from "@/features/commonCode/hooks/useCommonCodeOptions";

interface CommonCodeSelectProps {
  /** admin 에 등록된 코드그룹ID (예: "RCPT_TYPE_CD") */
  groupCode: string;
  /** form state 키. 폼의 공용 handleChange 를 그대로 쓸 때 필요 */
  name?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  /** 폼 제출 중 등 외부 사유로 잠글 때 */
  disabled?: boolean;
  className?: string;
  /** 미선택 상태에 보일 문구 */
  placeholder?: string;
}

/**
 * admin 공통코드 그룹을 select 로 렌더링하는 공용 입력.
 *
 * 자유 텍스트 입력이던 코드 필드들을 이걸로 바꾸면서, 백엔드 공통코드 검증(LAB017)에
 * 걸릴 값을 사용자가 애초에 입력할 수 없게 만드는 게 목적이다.
 *
 * ⚠ admin-service 가 꺼져 있으면 옵션이 비고 아래에 사유가 표시된다.
 *   즉 접수/일정 폼은 admin 이 떠 있어야 정상 동작한다.
 */
export default function CommonCodeSelect({
  groupCode,
  name,
  value,
  onChange,
  disabled = false,
  className,
  placeholder = "선택",
}: CommonCodeSelectProps) {
  const { options, loading, error } = useCommonCodeOptions(groupCode);

  return (
    <>
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled || loading}
        className={className}
      >
        <option value="">{loading ? "불러오는 중..." : placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? <span className="text-xs text-rose-500">{error}</span> : null}
    </>
  );
}
