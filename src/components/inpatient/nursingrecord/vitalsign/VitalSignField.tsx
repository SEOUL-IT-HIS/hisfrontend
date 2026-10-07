"use client";

import {
  isOutOfNormalRange,
  VITAL_SIGN_FIELD_META,
  VITAL_SIGN_NORMAL_RANGES,
} from "@/features/inpatient/nursingrecord/vitalsign/validation";
import { FIELD, LABEL } from "@/components/inpatient/common/styles";

type VitalSignFieldProps = {
  field: keyof typeof VITAL_SIGN_NORMAL_RANGES;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** 등록 폼은 필수, 수정 폼은 빈 값이면 기존 값 유지라 필수 아님 */
  required?: boolean;
};

/**
 * 활력징후 숫자 입력칸 (등록·수정 폼 공용)
 * - 입력칸 안에 예시값(placeholder)과 오른쪽 단위, 아래에 정상 범위 안내
 * - 정상 범위를 벗어나면 입력은 막지 않고 안내 줄이 경고 문구로 바뀜
 * - 입력 가능한 범위(min/max)는 오타만 막는 넓은 값 — 정상 범위와 다름 (validation.ts 참고)
 * - id/name 은 field 이름과 같아서 폼의 공용 change 핸들러(name 으로 필드 구분)가 그대로 동작
 */
export default function VitalSignField({ field, value, onChange, required = true }: VitalSignFieldProps) {
  const meta = VITAL_SIGN_FIELD_META[field];
  const normal = VITAL_SIGN_NORMAL_RANGES[field];
  const outOfRange = value !== "" && isOutOfNormalRange(field, Number(value));

  return (
    <div>
      <label htmlFor={field} className={LABEL}>
        {meta.label}
      </label>
      <div className="relative">
        <input
          type="number"
          id={field}
          name={field}
          value={value}
          onChange={onChange}
          placeholder={`e.g. ${meta.example}`}
          step={meta.step}
          min={meta.limit.min}
          max={meta.limit.max}
          inputMode="decimal"
          required={required}
          // 오른쪽 단위와 겹치지 않게 여백을 두고, 숫자 입력칸 기본 위아래 화살표는 숨김
          className={`${FIELD} pr-16 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">
          {meta.unit}
        </span>
      </div>
      <p className={`mt-1 text-xs ${outOfRange ? "font-medium text-rose-600" : "text-slate-400"}`}>
        {outOfRange ? "Outside normal range · " : "Normal "}
        {normal.min}~{normal.max} {meta.unit}
      </p>
    </div>
  );
}
