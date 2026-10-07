"use client";

import { DEFAULT_SCORE_LIMIT, getScoreScale } from "@/features/inpatient/nursingrecord/riskassessment/scoreScales";
import { FIELD, LABEL } from "@/components/inpatient/common/styles";

type RiskScoreFieldProps = {
  /** 선택한 평가 유형 — 유형에 따라 점수 범위·예시·안내가 바뀜 */
  assessmentTypeCd: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** 등록 폼은 필수, 수정 폼은 빈 값이면 기존 값 유지라 필수 아님 */
  required?: boolean;
};

/**
 * 위험도 평가 점수 입력칸 (등록·수정 폼 공용) — 활력징후 입력칸(VitalSignField)과 같은 모양
 * - 칸 안에 예시값과 오른쪽 단위, 아래에 점수 체계(범위·방향) 안내
 * - 유형을 바꾸면 범위와 안내도 따라 바뀜. 범위를 벗어난 값은 안내 줄이 붉게 바뀌고, 제출은 브라우저가 막음
 */
export default function RiskScoreField({ assessmentTypeCd, value, onChange, required = true }: RiskScoreFieldProps) {
  const scale = getScoreScale(assessmentTypeCd);
  const limit = scale ?? DEFAULT_SCORE_LIMIT;
  const outOfRange = value !== "" && (Number(value) < limit.min || Number(value) > limit.max);

  return (
    <div>
      <label htmlFor="score" className={LABEL}>
        Assessment Score
      </label>
      <div className="relative">
        <input
          type="number"
          id="score"
          name="score"
          value={value}
          onChange={onChange}
          placeholder={scale ? `e.g. ${scale.example}` : "Score"}
          step={1}
          min={limit.min}
          max={limit.max}
          inputMode="numeric"
          required={required}
          // 오른쪽 단위와 겹치지 않게 여백을 두고, 숫자 입력칸 기본 위아래 화살표는 숨김
          className={`${FIELD} pr-16 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">
          points
        </span>
      </div>
      <p className={`mt-1 text-xs ${outOfRange ? "font-medium text-rose-600" : "text-slate-400"}`}>
        {scale
          ? `${outOfRange ? "Out of range · " : ""}${scale.name} ${scale.min}~${scale.max} · ${scale.direction}`
          : "Select an assessment type to see its score range"}
      </p>
    </div>
  );
}
