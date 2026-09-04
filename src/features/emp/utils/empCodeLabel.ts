/**
 * 직원 화면용 공통코드 라벨 변환
 * - DB/API 에는 codeValue(01) 저장
 * - 화면에는 codeName(내과) 표시
 */
import type { SelectOption } from "@/components/common";
import type { CommonCodeItem } from "@/features/commonCode/types/commonCodeItemTypes";
import type { RoleType } from "@/features/emp/types/roleType";

/** codeValue → codeName. 없으면 원본 값 그대로 */
export function toCodeLabel(
  items: CommonCodeItem[],
  codeValue: string | null | undefined,
): string {
  if (!codeValue) return "-";
  return items.find((item) => item.codeValue === codeValue)?.codeName ?? codeValue;
}

/** Select options: value=코드값, label=코드명 */
export function toCodeSelectOptions(items: CommonCodeItem[]): SelectOption[] {
  return items.map((item) => ({
    value: item.codeValue,
    label: item.codeName,
  }));
}


/** roleId → roleName. 없으면 "-" (역할은 ROLE 테이블에서 내려온다) */
export function toRoleLabel(
  roles: RoleType[],
  roleId: string | null | undefined,
): string {
  if (!roleId) return "-";
  return roles.find((role) => role.roleId === roleId)?.roleName ?? roleId;
}

/** Select options: value=roleId, label=roleName */
export function toRoleSelectOptions(roles: RoleType[]): SelectOption[] {
  return roles.map((role) => ({
    value: role.roleId,
    label: role.roleName,
  }));
}