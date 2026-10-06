"use client";

import { useEffect, useId } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { FormField, Input } from "@/components/common";
import StaffPicker from "@/components/emergency/common/StaffPicker";
import { CODE_GROUP } from "@/features/emergency/codes";
import {
  fetchAllCommonCodesRequest,
  selectCommonCodeLoaded,
  selectCommonCodeLoading,
  selectCommonCodesByGroup,
} from "@/features/emergency/commonCode/slice";
import { useActorId, useLoginUser, useStaff, type ActorKind } from "@/features/emergency/common/staff";
import { buildStaffPickerModel } from "@/features/emergency/common/staffOptions";

type ActorFieldProps = {
  label: string;
  /** 직접 고르거나 입력한 값. 로그인 사용자를 쓰는 칸이면 로그인 정보가 없을 때만 쓰인다 */
  value: string;
  onChange: (empId: string) => void;
  /**
   * "DOCTOR": 의사 목록에서 고른다(기본은 로그인한 사람이 의사일 때 그 사람).
   * "STAFF": 의사·간호사 목록에서 고른다(기본은 로그인한 사람).
   */
  role: ActorKind;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

/**
 * 처리자(기록자·결정자·처방의·시행자 등) 칸.
 * 저장하는 값은 사람이 아무렇게나 적은 글자가 아니라 admin 직원 ID(empId)다.
 * - role="DOCTOR": 의사 드롭다운. 로그인한 사람이 의사면 처음부터 선택되어 있다. 구두처방처럼 간호사가 의사 대신 입력하는 칸에 쓴다.
 * - role="STAFF": 의사·간호사 드롭다운. 처음에는 로그인한 사람이고, 실제로 한 사람이 다르면 바꿔 고른다.
 *   PC를 같이 쓰고 로그아웃하지 않는 병원 환경을 고려해 기록자·시행자 칸도 로그인한 사람으로 고정하지 않는다.
 * 목록은 부서별로 묶어 응급의학과를 맨 위에 보여준다(다른 과 의사·간호사도 협진·당직으로 참여할 수 있어 막지 않는다).
 * 사번은 같은 이름이 둘 이상일 때만 보여준다.
 * 로그인 정보나 직원 목록을 못 받는 환경(단독 실행·세션 문제)에서는 직접 입력칸(또는 로그인 사용자)으로 대체한다.
 * 화면 밖에서 쓸 값은 같은 인자로 useActorId 를 호출해 얻는다.
 */
export default function ActorField({ label, value, onChange, role, required = false, disabled, className = "" }: ActorFieldProps) {
  const dispatch = useDispatch<AppDispatch>();
  const labelId = useId();
  const login = useLoginUser();
  const { doctors, nurses, loading } = useStaff(true);
  const actorId = useActorId(value, role);
  const commonCodeLoaded = useSelector(selectCommonCodeLoaded);
  const commonCodeLoading = useSelector(selectCommonCodeLoading);
  const deptCodes = useSelector(selectCommonCodesByGroup(CODE_GROUP.DEPT));

  // 부서 이름은 admin 공통코드(DEPT_CD)에서 읽는다
  useEffect(() => {
    if (!commonCodeLoaded && !commonCodeLoading) dispatch(fetchAllCommonCodesRequest());
  }, [dispatch, commonCodeLoaded, commonCodeLoading]);

  const people = role === "DOCTOR" ? doctors : [...doctors, ...nurses];

  const loginReadOnly = (
    <FormField label={label} required={required} className={className}>
      <Input value={login.empName} disabled readOnly />
    </FormField>
  );

  if (loading || people.length > 0) {
    const { pinned, groups } = buildStaffPickerModel({
      people,
      kind: role,
      actorId,
      login,
      deptName: (code) => deptCodes.find((c) => c.codeValue === code)?.codeName ?? code,
    });
    return (
      <div className={`flex min-w-0 flex-col gap-1.5 text-sm ${className}`}>
        {/* FormField 는 label 요소라 안의 클릭이 첫 버튼을 다시 누르게 되므로 쓰지 않는다 */}
        <span id={labelId} className="font-semibold text-slate-700">
          {label}
          {required ? <span className="text-rose-500"> *</span> : null}
        </span>
        <StaffPicker
          labelId={labelId}
          value={actorId}
          onChange={onChange}
          groups={groups}
          pinned={pinned}
          placeholder={role === "DOCTOR" ? "Select doctor" : "Select staff"}
          loading={loading}
          disabled={disabled}
        />
      </div>
    );
  }

  // 직원 목록을 못 받았다: 로그인한 사람이 있으면 그 사람으로, 없으면 직접 입력
  if (role === "STAFF" && login.signedIn) return loginReadOnly;

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
