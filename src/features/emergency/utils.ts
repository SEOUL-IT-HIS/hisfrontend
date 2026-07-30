/**
 * emergency 서비스 공통 유틸
 */

/** LocalDateTime(ISO 8601) 문자열을 "YYYY-MM-DD HH:mm" 형태로 표시한다. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
