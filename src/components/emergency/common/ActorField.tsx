"use client";

import { FormField, Input, Select } from "@/components/common";
import { useActorId, useLoginUser, useStaff } from "@/features/emergency/common/staff";

type ActorFieldProps = {
  label: string;
  /** 직접 고르거나 입력한 값. 로그인 사용자를 쓰는 칸이면 로그인 정보가 없을 때만 쓰인다 */
  value: string;
  onChange: (empId: string) => void;
  /** "DOCTOR" 면 admin 의사 목록에서 고른다. 없으면 로그인한 사용자가 처리자다 */
  role?: "DOCTOR";
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

/**
 * 처리자(기록자·결정자·처방의 등) 칸.
 * 저장하는 값은 사람이 아무렇게나 적은 글자가 아니라 admin 직원 ID(empId)다.
 * - 기본: 로그인한 사용자를 그대로 쓴다. 이름만 읽기 전용으로 보여주고 입력하지 않는다.
 * - role="DOCTOR": 의사 드롭다운. 로그인한 사람이 의사면 처음부터 선택되어 있다. 구두처방처럼 간호사가 의사 대신 입력하는 칸에 쓴다.
 * - 로그인 정보나 의사 목록을 못 받는 환경(단독 실행·세션 문제)에서는 직접 입력칸으로 대체한다.
 * 화면 밖에서 쓸 값은 같은 인자로 useActorId 를 호출해 얻는다.
 */
export default function ActorField({ label, value, onChange, role, required = false, disabled, className = "" }: ActorFieldProps) {
  const login = useLoginUser();
  const { doctors, loading } = useStaff(role === "DOCTOR");
  const actorId = useActorId(value, role);

  if (role !== "DOCTOR" && login.signedIn) {
    return (
      <FormField label={label} required={required} className={className}>
        <Input value={login.empName} disabled readOnly />
      </FormField>
    );
  }

  if (role === "DOCTOR" && (loading || doctors.length > 0)) {
    const options = doctors.map((d) => ({ value: d.empId, label: `${d.empName} (${d.empNo})` }));
    // 목록에 없는 값(예전 값 등)도 사라지지 않게 남겨 둔다
    if (actorId && !doctors.some((d) => d.empId === actorId)) options.unshift({ value: actorId, label: actorId });
    return (
      <FormField label={label} required={required} className={className}>
        <Select
          value={actorId}
          onChange={(e) => onChange(e.target.value)}
          options={options}
          placeholder={loading ? "Loading doctors..." : "Select doctor"}
          disabled={disabled || loading}
        />
      </FormField>
    );
  }

  return (
    <FormField label={label} required={required} className={className}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={role === "DOCTOR" ? "Doctor ID (doctor list unavailable)" : "Staff ID"}
        disabled={disabled}
        maxLength={36}
      />
    </FormField>
  );
}
