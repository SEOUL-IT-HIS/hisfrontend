"use client";

import Button from "@/components/common/Button";

type PaginationProps = {
  page: number;
  /** 0이면 다음 버튼 비활성 판단에 totalPages 사용 */
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

/**
 * 공통 페이지네이션
 * - 목록 페이지 이동에 사용 (page 는 1부터)
 */
export default function Pagination({
  page,
  totalPages,
  onPageChange,
  className = "",
}: PaginationProps) {
  const safeTotal = Math.max(totalPages, 1);
  const canPrev = page > 1;
  const canNext = page < safeTotal;

  return (
    <div className={`flex items-center justify-end gap-2 ${className}`}>
      <Button
        variant="secondary"
        disabled={!canPrev}
        onClick={() => onPageChange(page - 1)}
        className="h-8 px-3"
      >
        이전
      </Button>
      <span className="min-w-[80px] text-center text-sm text-slate-600">
        {page} / {safeTotal}
      </span>
      <Button
        variant="secondary"
        disabled={!canNext}
        onClick={() => onPageChange(page + 1)}
        className="h-8 px-3"
      >
        다음
      </Button>
    </div>
  );
}
