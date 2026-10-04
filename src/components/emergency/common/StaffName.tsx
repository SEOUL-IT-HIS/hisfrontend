"use client";

import { useStaff } from "@/features/emergency/common/staff";

/**
 * 직원 ID(empId)를 이름으로 보여준다. 직원 목록을 못 받았거나 목록에 없는 값(예전 기록 등)이면 ID 그대로 보여준다.
 */
export default function StaffName({ empId }: { empId?: string | null }) {
  const { nameById } = useStaff();
  if (!empId) return <>-</>;
  return <>{nameById.get(empId) ?? empId}</>;
}
