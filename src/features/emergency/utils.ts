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
    // 저체온
    {max: 35.5, label : "Hypothermia"},
    // 고열
    {min: 38.5, label : "Fever"},
  ],

  // 저산소증
  spo2: [{max:90, label: "Hypoxia"}],

  systolicBp: [
    // 저혈압
    {max: 90, label: "Hypotension"},
    // 고혈압
    {min: 180, label: "Hypertension"},
  ],

  heartRate: [
    // 서맥
    {max:50, label: "Bradycardia"},
    // 빈맥
    {min: 120, label: "Tachycardia"},
  ],

  respRate: [
    // 서호흡
    {max: 10, label: "Bradypnea"},
    // 빈호흡
    {min: 24, label: "Tachypnea"},
  ],

  // 중증 의식 저하
  gcs: [{max: 8,  label: "Severe Consciousness Impairment"}],
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