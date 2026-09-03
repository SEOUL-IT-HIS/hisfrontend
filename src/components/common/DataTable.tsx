"use client";

import type { ReactNode } from "react";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
  minWidthClassName?: string;
  equalColumns?: boolean;
  className?: string;
  /** 지정하면 행 전체(여백 포함) 클릭이 가능해진다 */
  onRowClick?: (row: T) => void;
  /** true를 반환한 행을 강조 표시한다 (예: 현재 선택된 행) */
  isRowActive?: (row: T) => boolean;
};

/**
 * 공통 데이터 테이블
 */
export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  loadingMessage = "목록을 불러오는 중입니다...",
  emptyMessage = "조회된 데이터가 없습니다.",
  minWidthClassName = "min-w-[720px]",
  equalColumns = false,
  className = "",
  onRowClick,
  isRowActive,
}: DataTableProps<T>) {
  const colSpan = columns.length;
  const equalWidth = equalColumns && colSpan > 0 ? `${100 / colSpan}%` : undefined;

  return (
    <div
      className={`min-h-0 flex-1 overflow-auto rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}
    >
      <table
        className={`w-full ${equalColumns ? "table-fixed" : ""} ${minWidthClassName} text-left text-sm`}
      >
        <thead className="sticky top-0 border-b border-slate-100 bg-slate-50/95 text-slate-400 backdrop-blur">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={equalWidth ? { width: equalWidth } : undefined}
                className={`px-4 py-3 text-xs font-medium uppercase tracking-wide ${col.className ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={colSpan} className="px-4 py-16 text-center text-slate-400">
                {loadingMessage}
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className="px-4 py-16 text-center text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const active = isRowActive?.(row) ?? false;
              return (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-t border-l-4 transition-colors ${onRowClick ? "cursor-pointer" : ""} ${
                  active
                    ? "border-l-sky-500 bg-sky-50 hover:bg-sky-50"
                    : "border-l-transparent border-t-slate-50 hover:bg-slate-50/80"
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`truncate px-4 py-3 text-slate-700 ${col.className ?? ""}`}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
