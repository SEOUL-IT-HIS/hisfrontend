"use client";

import StaffSelect from "@/components/inpatient/nursingrecord/StaffSelect";

type NurseSelectProps = {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  className: string;
  required?: boolean;
};

/** 간호기록 기록자/평가자 선택 — admin 등록 간호사 드롭다운 (StaffSelect role="NURSE") */
const NurseSelect = (props: NurseSelectProps) => <StaffSelect role="NURSE" {...props} />;

export default NurseSelect;
