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
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                className="border-t border-slate-50 transition-colors hover:bg-slate-50/80"
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
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
