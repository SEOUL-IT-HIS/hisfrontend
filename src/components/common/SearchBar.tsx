"use client";

import type { FormEvent, ReactNode } from "react";
import Button from "@/components/common/Button";

type SearchBarProps = {
  /** 검색 조건 입력 UI */
  children: ReactNode;
  onSearch: () => void;
  searchLabel?: string;
  /** 초기화 버튼이 필요할 때 */
  onReset?: () => void;
  resetLabel?: string;
  className?: string;
};

/**
 * 공통 검색 영역
 * - 목록 조회 조건 + 조회/초기화 버튼 레이아웃
 */
export default function SearchBar({
  children,
  onSearch,
  searchLabel = "조회",
  onReset,
  resetLabel = "초기화",
  className = "",
}: SearchBarProps) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSearch();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-xl border border-slate-200 bg-white px-4 py-3 ${className}`}
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap gap-3">{children}</div>
        <div className="flex items-center gap-2">
          {onReset ? (
            <Button type="button" variant="secondary" onClick={onReset}>
              {resetLabel}
            </Button>
          ) : null}
          <Button type="submit" variant="primary">
            {searchLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
