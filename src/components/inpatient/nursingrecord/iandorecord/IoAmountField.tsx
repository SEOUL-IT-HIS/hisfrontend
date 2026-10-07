"use client";

import {
  DEFAULT_IO_AMOUNT_EXAMPLE,
  IO_AMOUNT_EXAMPLE,
  IO_AMOUNT_LIMIT,
} from "@/features/inpatient/nursingrecord/iandorecord/amountLimits";
import { FIELD, LABEL } from "@/components/inpatient/common/styles";

type IoAmountFieldProps = {
  /** 선택한 경로 — 경로에 맞는 예시값을 placeholder 로 보여줌 */
  routeCd: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** 등록 폼은 필수, 수정 폼은 빈 값이면 기존 값 유지라 필수 아님 */
  required?: boolean;
};

/**
 * I&O 수량 입력칸 (등록·수정 폼 공용) — 활력징후·위험도 점수 입력칸과 같은 모양
 * - 칸 안에 예시값과 오른쪽 단위(mL), 아래에 입력 범위 안내
 * - 범위를 벗어나면 안내 줄이 붉게 바뀌고, 제출은 브라우저가 막음
 */
export default function IoAmountField({ routeCd, value, onChange, required = true }: IoAmountFieldProps) {
  const outOfRange = value !== "" && (Number(value) < IO_AMOUNT_LIMIT.min || Number(value) > IO_AMOUNT_LIMIT.max);

  return (
    <div>
      <label htmlFor="amountMl" className={LABEL}>
        Amount
      </label>
      <div className="relative">
        <input
          type="number"
          id="amountMl"
          name="amountMl"
          value={value}
          onChange={onChange}
          placeholder={`e.g. ${IO_AMOUNT_EXAMPLE[routeCd] ?? DEFAULT_IO_AMOUNT_EXAMPLE}`}
          step={1}
          min={IO_AMOUNT_LIMIT.min}
          max={IO_AMOUNT_LIMIT.max}
          inputMode="numeric"
          required={required}
          // 오른쪽 단위와 겹치지 않게 여백을 두고, 숫자 입력칸 기본 위아래 화살표는 숨김
          className={`${FIELD} pr-16 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">
          mL
        </span>
      </div>
      <p className={`mt-1 text-xs ${outOfRange ? "font-medium text-rose-600" : "text-slate-400"}`}>
        {outOfRange ? "Out of range · " : ""}Per record · {IO_AMOUNT_LIMIT.min}~{IO_AMOUNT_LIMIT.max} mL
      </p>
    </div>
  );
}
