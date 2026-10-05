"use client";

import { Input, Select } from "@/components/common";
import { useStaffDirectory } from "@/features/labimaging/common/hooks/useStaffDirectory";

/**
 * 의사 선택 드롭다운. (직원 검증, 2026-10-05, 04번 지시서 Phase 2-D)
 *
 * ⚠ 자유 입력(Input)이 아니다. 화면에서 직원ID를 손으로 적게 두면 오타·존재하지 않는 ID가
 *   그대로 서버에 전달된다 — 서버 직원 검증이 ENFORCE 모드일 때만 걸리고, 그 전(WARN/OFF
 *   — 지금 기본값)에는 조용히 잘못된 값으로 저장된다. 드롭다운으로 고르게 하면 화면 단계에서
 *   원천적으로 막힌다(오입력 방지, 지시서 Phase 4 와 같은 목적을 이 입력에서 먼저 해결).
 *
 * ⚠ 직원 디렉터리를 못 불러오면(admin 세션 없음, 개발 PC 단독 기동 등) 드롭다운 대신
 *   자유 입력으로 대체한다 — useStaffDirectory 자체의 fail-soft 원칙과 같다. 이때 value 는
 *   더 이상 empId 로 제한되지 않는다. 호출부가 그 의미를 알아서 처리해야 한다
 *   (예: LabOrderReceptionForm/ImageOrderReceptionForm 은 이때 physicianId 대신 physicianNo
 *   자리로 돌려 보낸다 — 두 컴포넌트는 useStaffDirectory().failed 를 똑같이 읽어 판단한다.
 *   module 전역 캐시를 공유하므로 이 컴포넌트와 호출부가 같은 결론을 낸다).
 *
 * ⚠ labimaging 전용 컴포넌트다. 공통(components/common)에 두지 않는다 — 공통 컴포넌트는
 *   리더 관리 대상이고, "의사만 보여준다"는 판단은 이 도메인에만 있는 규칙이다.
 */
type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

export default function DoctorSelect({ value, onChange, disabled, placeholder }: Props) {
  const { doctors, loading, failed, reload } = useStaffDirectory();

  if (failed) {
    return (
      <>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={36}
          disabled={disabled}
          placeholder="Enter staff ID (directory unavailable)"
        />
        <span className="text-xs text-amber-600">
          Couldn&apos;t load the doctor list.{" "}
          <button type="button" onClick={reload} className="underline">
            Retry
          </button>
        </span>
      </>
    );
  }

  const options = doctors.map((doctor) => ({
    value: doctor.empId,
    label: `${doctor.empName} (${doctor.empNo})`,
  }));

  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      options={options}
      placeholder={loading ? "Loading..." : (placeholder ?? "Select doctor")}
      disabled={disabled || loading}
    />
  );
}
