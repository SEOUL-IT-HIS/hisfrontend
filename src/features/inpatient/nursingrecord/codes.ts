// 간호기록 코드 선택지
// admin 공통코드에 간호기록용 그룹이 아직 없어서 병동 화면에서 고정값으로 관리함
// (나중에 admin 공통코드로 등록하면 같은 codeValue를 쓰고 드롭다운 출처만 바꾸면 됨)

export type CodeOption = { value: string; label: string };

// 위험도 평가 유형
export const ASSESSMENT_TYPE_OPTIONS: CodeOption[] = [
  { value: "FALL", label: "Fall Risk (낙상)" },
  { value: "PRESSURE_ULCER", label: "Pressure Ulcer (욕창)" },
  { value: "PAIN", label: "Pain (통증)" },
];

// 위험 등급 — 목록/상세의 기존 배지(RISK_BADGE: LOW/MEDIUM/HIGH)와 같은 값
export const RISK_LEVEL_OPTIONS: CodeOption[] = [
  { value: "LOW", label: "Low Risk" },
  { value: "MEDIUM", label: "Medium Risk" },
  { value: "HIGH", label: "High Risk" },
];

// 신체억제대 유형
export const RESTRAINT_TYPE_OPTIONS: CodeOption[] = [
  { value: "WRIST", label: "Wrist (손목)" },
  { value: "ANKLE", label: "Ankle (발목)" },
  { value: "VEST", label: "Vest (조끼)" },
  { value: "MITT", label: "Mitt (장갑)" },
];

// 의식 상태
export const MENTAL_STATUS_OPTIONS: CodeOption[] = [
  { value: "ALERT", label: "Alert (명료)" },
  { value: "DROWSY", label: "Drowsy (기면)" },
  { value: "STUPOR", label: "Stupor (혼미)" },
  { value: "SEMICOMA", label: "Semi-coma (반혼수)" },
  { value: "COMA", label: "Coma (혼수)" },
];

// 알레르기 여부
export const YN_OPTIONS: CodeOption[] = [
  { value: "N", label: "No" },
  { value: "Y", label: "Yes" },
];

// 섭취/배설 구분
export const IO_TYPE_OPTIONS: CodeOption[] = [
  { value: "INTAKE", label: "Intake (섭취)" },
  { value: "OUTPUT", label: "Output (배설)" },
];

// 섭취/배설 경로 — 구분에 따라 선택지가 다름
export const IO_ROUTE_OPTIONS: Record<string, CodeOption[]> = {
  INTAKE: [
    { value: "ORAL", label: "Oral (경구)" },
    { value: "IV", label: "IV (정맥)" },
    { value: "TUBE", label: "Tube (경관)" },
  ],
  OUTPUT: [
    { value: "URINE", label: "Urine (소변)" },
    { value: "STOOL", label: "Stool (대변)" },
    { value: "VOMIT", label: "Vomit (구토)" },
    { value: "DRAIN", label: "Drain (배액)" },
  ],
};
export const ALL_IO_ROUTE_OPTIONS: CodeOption[] = [...IO_ROUTE_OPTIONS.INTAKE, ...IO_ROUTE_OPTIONS.OUTPUT];

// 코드값 → 표시 라벨 (목록/상세용). 목록에 없는 예전 값은 그대로 보여줌
export const codeLabel = (options: CodeOption[], value: string | null | undefined) =>
  value ? options.find((o) => o.value === value)?.label ?? value : "-";
