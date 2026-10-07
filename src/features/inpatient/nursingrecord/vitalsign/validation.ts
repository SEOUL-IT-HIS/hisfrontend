export const VITAL_SIGN_NORMAL_RANGES = {
  temperature: { min: 36.0, max: 37.5, label: "체온", unit: "°C" },
  pulse: { min: 60, max: 100, label: "맥박", unit: "회/분" },
  respiration: { min: 12, max: 20, label: "호흡수", unit: "회/분" },
  bpSystolic: { min: 90, max: 120, label: "수축기 혈압", unit: "mmHg" },
  bpDiastolic: { min: 60, max: 80, label: "이완기 혈압", unit: "mmHg" },
  spo2: { min: 95, max: 100, label: "산소포화도", unit: "%" },
} as const;

export function isOutOfNormalRange(
  field: keyof typeof VITAL_SIGN_NORMAL_RANGES,
  value: number,
): boolean {
  if (Number.isNaN(value)) return false;
  const { min, max } = VITAL_SIGN_NORMAL_RANGES[field];
  return value < min || value > max;
}

/**
 * 입력칸 표시·제한 정보 (등록·수정 폼 공용)
 * - limit: 입력 가능한 범위 — 정상 범위가 아니라 "오타를 막는" 넓은 범위. 응급·중증 환자 수치도 기록할 수 있어야 해서
 *   (예전엔 호흡수 12~20처럼 정상 범위가 그대로 입력 제한이라 비정상 수치를 기록할 수 없었음)
 * - 정상 범위를 벗어나면 막지 않고 입력칸 아래에 경고만 보여줌 (VITAL_SIGN_NORMAL_RANGES)
 * - 이 limit 값은 일반적인 생리 범위로 잡은 제안값 — 병동 기준이 따로 있으면 여기만 고치면 됨
 */
export const VITAL_SIGN_FIELD_META = {
  temperature: { label: "Temperature", unit: "°C", example: "36.5", step: 0.1, limit: { min: 25, max: 45 } },
  pulse: { label: "Pulse", unit: "bpm", example: "72", step: 1, limit: { min: 20, max: 300 } },
  respiration: { label: "Respiration Rate", unit: "/min", example: "16", step: 1, limit: { min: 4, max: 60 } },
  bpSystolic: { label: "Systolic Blood Pressure", unit: "mmHg", example: "120", step: 1, limit: { min: 40, max: 300 } },
  bpDiastolic: { label: "Diastolic Blood Pressure", unit: "mmHg", example: "80", step: 1, limit: { min: 20, max: 200 } },
  spo2: { label: "SpO2", unit: "%", example: "98", step: 0.1, limit: { min: 50, max: 100 } },
} as const satisfies Record<keyof typeof VITAL_SIGN_NORMAL_RANGES, unknown>;
