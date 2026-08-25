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
