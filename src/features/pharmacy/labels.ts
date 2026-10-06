/** admin 공통코드 DOSAGE_FORM_CD 라벨 — 코드값만 보여주면 알아보기 어려워 표시용으로만 둔다 */
const DOSAGE_FORM_LABELS: Record<string, string> = {
  "01": "Tablet/Capsule",
  "02": "IV Fluid",
  "03": "Injection",
};

export function dosageFormLabel(code: string | null | undefined): string {
  if (!code) return "-";
  return DOSAGE_FORM_LABELS[code] ?? code;
}
