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


type CriticalRule = {min? : number;  max?:number;  label: string};

const VITAL_CRITICAL_RULES : Record<string, CriticalRule[]> = {
  temperature : [
    {max: 35.5, label : "저체온"},
    {min: 38.5, label : "고열"},
  ],

  spo2: [{max:90, label: "저산소증"}],

  systolicBp: [
    {max: 90, label: "저혈압"},
    {min: 180, label: "고혈압"},
  ],

  heartRate: [
    {max:50, label: "서맥"},
    {min: 120, label: "빈맥"},
  ],

  respRate: [
    {max: 10, label: "서호흡"},
    {min: 24, label: "빈호흡"},
  ],

  gcs: [{max: 8,  label: "중증 의식 저하"}],
};


/**
 * 활력징후 값에 위험 라벨을 붙여 표시한다 (프론트 전용, DB엔 숫자만 저장됨).
 * 값이 없으면(null/undefined) 그대로 "-"를 반환한다.
 */
export function formatVitalDisplay(
    vitalType: string,
    value: number | null | undefined,
    unit = "",
): string {
  if (value === null || value === undefined) return "-";

  const rule = VITAL_CRITICAL_RULES[vitalType]?.find(
      (r) => (r.min === undefined || value >= r.min) && (r.max === undefined || value <= r.max),
  );
  return rule ? `${value}${unit}(${rule.label})` : `${value}${unit}`;
}

/** 배열에서 getTime 기준으로 가장 최신 항목을 찾는다 (백엔드 정렬 미보장 대응 공용 헬퍼). */
export function latestByTime<T>(items: T[], getTime: (item: T) => string | null | undefined): T | null {
  if (items.length === 0) return null;
  const sorted = [...items].sort(
    (a, b) => new Date(getTime(a) ?? 0).getTime() - new Date(getTime(b) ?? 0).getTime(),
  );
  return sorted[sorted.length - 1];
}