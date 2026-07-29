"use client";

import type { FormEvent, ReactNode } from "react";
import Button from "@/components/common/Button";

type SearchBarProps = {
  children: ReactNode;
  onSearch: () => void;
  searchLabel?: string;
  onReset?: () => void;
  resetLabel?: string;
  className?: string;
};

/**
 * 공통 검색 영역
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
      className={`rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}
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
