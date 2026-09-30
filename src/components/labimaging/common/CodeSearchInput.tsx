"use client";

import { useId } from "react";
import { Input } from "@/components/common";
import type { CommonCodeOption } from "@/features/commonCode/hooks/useCommonCodeOptions";

/**
 * 코드가 많은 공통코드(균종·항생제·병리진단명)를 "검색해서" 고르는 입력칸. (5차 D5)
 *
 * ⚠ 브라우저 기본 datalist 를 쓴다. 옵션의 value=코드값, label=코드명 이라 코드·이름 어느 쪽을
 *   쳐도 부분일치로 후보가 뜬다. 고르면 입력칸에는 코드값이 들어가고, 옆에 이름을 보여준다.
 *   별도 라이브러리나 공통 컴포넌트(리더 관리 대상)를 만들지 않으려고 이 방식으로 했다.
 *
 * ⚠ 목록에 없는 값을 쳐도 입력은 된다(datalist 의 한계). 그래서 화면에 "Unknown code"로 표시하고,
 *   최종 검증은 서버의 공통코드 검증(LAB017, fail-closed)이 한다.
 */
type Props = {
  value: string;
  onChange: (code: string) => void;
  options: CommonCodeOption[];
  disabled?: boolean;
  placeholder?: string;
  name?: string;
};

export default function CodeSearchInput({ value, onChange, options, disabled, placeholder, name }: Props) {
  const listId = useId();
  const matched = options.find((opt) => opt.value === value);

  return (
    <div className="flex flex-col gap-1">
      <Input
        name={name}
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value.trim())}
        disabled={disabled}
        placeholder={placeholder ?? "Search by code or name"}
        autoComplete="off"
      />
      <datalist id={listId}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} label={opt.label} />
        ))}
      </datalist>
      {value ? (
        <span className={`text-xs ${matched ? "text-slate-500" : "text-rose-500"}`}>
          {matched ? matched.label : "Unknown code"}
        </span>
      ) : null}
    </div>
  );
}
