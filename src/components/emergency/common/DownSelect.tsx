"use client";

import { useId } from "react";
import StaffPicker from "@/components/emergency/common/StaffPicker";

type DownSelectProps = {
  label: string;
  /** true 면 라벨을 화면에서는 감추고 스크린리더용으로만 둔다(검색줄의 필터 등 제목이 필요 없는 곳) */
  hideLabel?: boolean;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
  /** true 면 목록 맨 위에 "선택 안 함" 줄을 둔다(선택 항목용) */
  allowClear?: boolean;
  disabled?: boolean;
  /** 선택 상자 아래 작은 안내 글자 */
  hint?: string;
  className?: string;
};

/**
 * 일반 선택 칸 — 브라우저 기본 select 는 공간이 모자라면 목록이 위로 열려서, 항상 칸 아래로만 열리는 드롭다운을 쓴다.
 * (StaffPicker 와 같은 드롭다운. 항목이 많으면 검색칸이 나온다.)
 */
export default function DownSelect({
  label,
  hideLabel = false,
  required = false,
  value,
  onChange,
  options,
  placeholder = "Select",
  allowClear = false,
  disabled = false,
  hint,
  className = "",
}: DownSelectProps) {
  const labelId = useId();
  const pinned = allowClear ? [{ value: "", name: placeholder, searchText: "" }] : [];
  const groups = [
    {
      key: "all",
      label: "",
      highlight: false,
      options: options.map((o) => ({ value: o.value, name: o.label, searchText: o.label.toLowerCase() })),
    },
  ];
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 text-sm ${className}`}>
      {/* FormField 는 label 요소라 안의 클릭이 첫 버튼을 다시 누르게 되므로 쓰지 않는다 */}
      <span id={labelId} className={hideLabel ? "sr-only" : "font-semibold text-slate-700"}>
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </span>
      <StaffPicker
        labelId={labelId}
        value={value}
        onChange={onChange}
        groups={groups}
        pinned={pinned}
        placeholder={placeholder}
        disabled={disabled}
      />
      {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
    </div>
  );
}
